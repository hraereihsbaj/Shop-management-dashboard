// src/modules/bot/bot.service.ts
process.env.NTBA_FIX_319 = "1";
import TelegramBot from "node-telegram-bot-api";
import prisma from "../../prisma/prisma.js";
import * as reportService from "../reports/report.service.js";
import * as expenseService from "../expenses/expense.service.js";
import * as productService from "../products/product.service.js";
import * as saleService from "../sales/sale.service.js";
import * as xlsx from "xlsx";
// Load the token from our .env file
const token = process.env.TELEGRAM_BOT_TOKEN;
export function initializeBot() {
    if (!token) {
        console.warn("⚠️ Telegram Bot Token not found. Bot is disabled.");
        return;
    }
    // Polling means our app constantly asks Telegram if there are new messages
    const bot = new TelegramBot(token, { polling: true });
    console.log("🤖 Telegram Bot is awake and listening...");
    // Global Authorization Middleware (Monkey patch processUpdate)
    const originalProcessUpdate = bot.processUpdate.bind(bot);
    bot.processUpdate = (update) => {
        const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
        const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
        if (adminId && chatId && String(chatId) !== adminId) {
            console.warn(`⛔ Unauthorized Telegram access attempt from chat ID: ${chatId}`);
            if (update.message?.chat?.id) {
                bot.sendMessage(chatId, "⛔ You are not authorized to use this bot.");
            }
            return Promise.resolve();
        }
        return originalProcessUpdate(update);
    };
    // Native Telegram Command Picker Menu
    bot.setMyCommands([
        { command: "commands", description: "List all available bot commands" },
        { command: "help", description: "Show help and command guide" },
        { command: "date", description: "Filter all reports & records by date (e.g. /date 2 aug 2026)" },
        { command: "addsale", description: "Record a new sale" },
        { command: "addproduct", description: "Create or restock a product" },
        { command: "addexpense", description: "Log a business expense" },
        { command: "deleteproduct", description: "Delete product by ID/Name" },
        { command: "deletesale", description: "Delete sale entry by ID" },
        { command: "deleteexpense", description: "Delete expense entry by ID" },
        { command: "profit", description: "View P&L report (optional: /profit 2 aug 2026)" },
        { command: "products", description: "View products (optional: /products 2 aug 2026)" },
        { command: "sales", description: "View sales (optional: /sales 2 aug 2026)" },
        { command: "expenses", description: "View expenses (optional: /expenses 2 aug 2026)" }
    ]).catch(err => console.error("Failed to set bot commands:", err));
    // Welcome / Help / Commands Handler
    bot.onText(/\/(start|help|commands)/, (msg) => {
        const chatId = msg.chat.id;
        const helpMenu = `
🤖 *ShopPilot Assistant - Available Commands*

*📅 Date Filtering:*
• \`/date <date>\` — Filter ALL metrics, sales, products & expenses by date (e.g. \`/date 2 aug 2026\` or \`/date 2026-08-02\`)

*🛒 Add Commands:*
• \`/addsale\` — Record a new sale transaction
• \`/addproduct\` — Create a new product or restock
• \`/addexpense\` — Log a business expense

*🗑️ Delete Commands:*
• \`/deleteproduct <id_or_name>\` — Delete product from inventory
• \`/deletesale <id>\` — Delete sale entry & restore stock
• \`/deleteexpense <id>\` — Delete expense entry

*📊 Reports & Listing Commands:*
• \`/profit [date|month year]\` — Calculate P&L (e.g. \`/profit 2 aug 2026\` or \`/profit 8 2026\`)
• \`/products [date|asc|desc]\` — List products (e.g. \`/products 2 aug 2026\`)
• \`/sales [date|asc|desc]\` — List sales (e.g. \`/sales 2 aug 2026\`)
• \`/expenses [date|asc|desc]\` — List expenses (e.g. \`/expenses 2 aug 2026\`)
• \`/product <id_or_name>\` — View details for a specific product
• \`/sale <id>\` — View details for a specific sale
• \`/commands\` — Display this command menu

💡 *Tip:* You can type \`cancel\` anytime to stop an ongoing action!
    `;
        bot.sendMessage(chatId, helpMenu, { parse_mode: "Markdown" });
    });
    // -------------------------------------------------------------
    // 1. ADD EXPENSE (guided, one field at a time)
    // -------------------------------------------------------------
    const pendingExpenseByChat = new Map();
    bot.onText(/\/addexpense(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const text = match?.[1]?.trim();
        if (!text) {
            pendingExpenseByChat.set(chatId, { step: 1, data: {} });
            return bot.sendMessage(chatId, "📝 Let’s add an expense. Please send the title.");
        }
        pendingExpenseByChat.set(chatId, { step: 2, data: { title: text } });
        return bot.sendMessage(chatId, "📂 Please send the expense category.");
    });
    // -------------------------------------------------------------
    // 2. ADD PRODUCT (guided, one field at a time)
    // -------------------------------------------------------------
    const pendingProductByChat = new Map();
    bot.onText(/\/addproduct(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const text = match?.[1]?.trim();
        if (!text) {
            pendingProductByChat.set(chatId, { step: 1, data: {} });
            return bot.sendMessage(chatId, "📝 Let’s add a product. Please send the product name.");
        }
        pendingProductByChat.set(chatId, { step: 1, data: { name: text } });
        return bot.sendMessage(chatId, "📝 Please send the product category.");
    });
    bot.on("message", async (msg) => {
        if (!msg.text || msg.text.startsWith("/"))
            return;
        const chatId = msg.chat.id;
        const value = msg.text.trim();
        if (value.toLowerCase() === "cancel") {
            pendingExpenseByChat.delete(chatId);
            pendingSaleByChat.delete(chatId);
            pendingProductByChat.delete(chatId);
            return bot.sendMessage(chatId, "❌ Flow cancelled.");
        }
        const pendingExpense = pendingExpenseByChat.get(chatId);
        if (pendingExpense) {
            if (pendingExpense.step === 1) {
                if (!value || value.length < 2) {
                    return bot.sendMessage(chatId, "⚠️ Please provide a valid expense title. Try again.");
                }
                pendingExpense.data.title = value;
                pendingExpense.step = 2;
                return bot.sendMessage(chatId, "📂 Please send the expense category.");
            }
            if (pendingExpense.step === 2) {
                if (!value || value.length < 2) {
                    return bot.sendMessage(chatId, "⚠️ Please provide a valid expense category. Try again.");
                }
                pendingExpense.data.category = value;
                pendingExpense.step = 3;
                return bot.sendMessage(chatId, "💰 Please send the expense amount.");
            }
            if (pendingExpense.step === 3) {
                const amount = Number(value);
                if (!Number.isFinite(amount) || amount <= 0) {
                    return bot.sendMessage(chatId, "⚠️ Please enter a valid positive amount.");
                }
                pendingExpense.data.amount = value;
                pendingExpense.step = 4;
                return bot.sendMessage(chatId, "📝 Please send any notes (or type skip).");
            }
            if (pendingExpense.step === 4) {
                const notes = value.toLowerCase() === "skip" ? "" : value;
                try {
                    await expenseService.createExpense({
                        title: pendingExpense.data.title || "",
                        category: pendingExpense.data.category || "",
                        amount: Number(pendingExpense.data.amount),
                        notes
                    });
                    pendingExpenseByChat.delete(chatId);
                    return bot.sendMessage(chatId, `✅ Expense added: ${pendingExpense.data.title} (₹${pendingExpense.data.amount})`);
                }
                catch (error) {
                    pendingExpenseByChat.delete(chatId);
                    return bot.sendMessage(chatId, "❌ Failed to create expense. Please try again.");
                }
            }
        }
        const pendingSale = pendingSaleByChat.get(chatId);
        if (pendingSale) {
            if (pendingSale.step === 1) {
                if (!value || value.length < 2) {
                    return bot.sendMessage(chatId, "⚠️ Please provide a valid product name. Try again.");
                }
                try {
                    // Prefer exact name match, fall back to partial match
                    let exactMatch = await prisma.product.findFirst({
                        where: { name: { equals: value, mode: "insensitive" }, isActive: true }
                    });
                    const products = exactMatch
                        ? [exactMatch]
                        : await prisma.product.findMany({
                            where: { name: { contains: value, mode: "insensitive" }, isActive: true }
                        });
                    if (products.length === 0) {
                        pendingSaleByChat.delete(chatId);
                        return bot.sendMessage(chatId, `❌ No existing product found for "${value}". Please add the product first, then try the sale again.`);
                    }
                    pendingSale.data.productName = value;
                    pendingSale.step = 2;
                    return bot.sendMessage(chatId, "🔢 Please send the quantity.");
                }
                catch (error) {
                    pendingSaleByChat.delete(chatId);
                    return bot.sendMessage(chatId, "❌ Failed to validate the product. Please try again.");
                }
            }
            if (pendingSale.step === 2) {
                const quantity = Number(value);
                if (!Number.isFinite(quantity) || quantity <= 0) {
                    return bot.sendMessage(chatId, "⚠️ Please enter a valid positive quantity.");
                }
                pendingSale.data.quantity = value;
                pendingSale.step = 3;
                return bot.sendMessage(chatId, "💳 Please send the payment method.");
            }
            if (pendingSale.step === 3) {
                pendingSale.data.paymentMethod = value;
                try {
                    // Prefer exact name match, fall back to partial match
                    const productName = pendingSale.data.productName || "";
                    let exactMatch = await prisma.product.findFirst({
                        where: { name: { equals: productName, mode: "insensitive" }, isActive: true }
                    });
                    const products = exactMatch
                        ? [exactMatch]
                        : await prisma.product.findMany({
                            where: { name: { contains: productName, mode: "insensitive" }, isActive: true }
                        });
                    if (products.length === 0) {
                        pendingSaleByChat.delete(chatId);
                        return bot.sendMessage(chatId, `❌ No existing product found for "${productName}". Please add the product first, then try the sale again.`);
                    }
                    const product = products[0];
                    const quantity = Number(pendingSale.data.quantity);
                    if (product.stock < quantity) {
                        pendingSaleByChat.delete(chatId);
                        return bot.sendMessage(chatId, `⚠️ Not enough stock! You only have ${product.stock} left.`);
                    }
                    await saleService.createSale({
                        paymentMethod: pendingSale.data.paymentMethod,
                        totalAmount: Number(product.sellingPrice) * quantity,
                        items: [{
                                productId: product.id,
                                quantity,
                                costPrice: Number(product.costPrice),
                                sellingPrice: Number(product.sellingPrice)
                            }]
                    });
                    pendingSaleByChat.delete(chatId);
                    return bot.sendMessage(chatId, `✅ Sale complete! Sold ${quantity}x ${product.name} for ₹${Number(product.sellingPrice) * quantity}`);
                }
                catch (error) {
                    console.error("❌ Bot sale error:", error);
                    pendingSaleByChat.delete(chatId);
                    const errMsg = error instanceof Error ? error.message : "Unknown error";
                    return bot.sendMessage(chatId, `❌ Failed to create sale: ${errMsg}`);
                }
            }
        }
        const pending = pendingProductByChat.get(chatId);
        if (!pending)
            return;
        if (pending.step === 1) {
            if (!value || value.length < 2) {
                return bot.sendMessage(chatId, "⚠️ Please provide a valid product name. Try again.");
            }
            pending.data.name = value;
            pending.step = 2;
            return bot.sendMessage(chatId, "📦 Please send the product category.");
        }
        if (pending.step === 2) {
            if (!value || value.length < 2) {
                return bot.sendMessage(chatId, "⚠️ Please provide a valid product category. Try again.");
            }
            pending.data.category = value;
            pending.step = 3;
            return bot.sendMessage(chatId, "💰 Please send the cost price.");
        }
        if (pending.step === 3) {
            const costPrice = Number(value);
            if (!Number.isFinite(costPrice) || costPrice < 0) {
                return bot.sendMessage(chatId, "⚠️ Please enter a valid non-negative cost price.");
            }
            pending.data.costPrice = value;
            pending.step = 4;
            return bot.sendMessage(chatId, "💵 Please send the selling price.");
        }
        if (pending.step === 4) {
            const sellingPrice = Number(value);
            if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
                return bot.sendMessage(chatId, "⚠️ Please enter a valid non-negative selling price.");
            }
            pending.data.sellingPrice = value;
            pending.step = 5;
            return bot.sendMessage(chatId, "📦 Please send the initial stock.");
        }
        if (pending.step === 5) {
            const stock = Number(value);
            if (!Number.isFinite(stock) || stock < 0) {
                return bot.sendMessage(chatId, "⚠️ Please enter a valid non-negative stock value.");
            }
            try {
                await productService.createProduct({
                    name: pending.data.name || "",
                    category: pending.data.category || "",
                    costPrice: Number(pending.data.costPrice),
                    sellingPrice: Number(pending.data.sellingPrice),
                    stock: Number(value)
                });
                pendingProductByChat.delete(chatId);
                return bot.sendMessage(chatId, `✅ Product added: ${pending.data.name} (Stock: ${value})`);
            }
            catch (error) {
                pendingProductByChat.delete(chatId);
                return bot.sendMessage(chatId, "❌ Failed to create product. Please try again.");
            }
        }
    });
    // -------------------------------------------------------------
    // 3. ADD SALE (guided, one field at a time)
    // -------------------------------------------------------------
    const pendingSaleByChat = new Map();
    bot.onText(/\/addsale(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const text = match?.[1]?.trim();
        if (!text) {
            pendingSaleByChat.set(chatId, { step: 1, data: {} });
            return bot.sendMessage(chatId, "🛍️ Let’s log a sale. Please send the product name.");
        }
        pendingSaleByChat.set(chatId, { step: 2, data: { productName: text } });
        return bot.sendMessage(chatId, "🔢 Please send the quantity.");
    });
    // -------------------------------------------------------------
    // FILTER ALL DATA BY DATE (/date <date_string>)
    // -------------------------------------------------------------
    bot.onText(/\/date(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const query = match?.[1]?.trim();
        if (!query) {
            return bot.sendMessage(chatId, "⚠️ Usage: `/date <YYYY-MM-DD>` or `/date 2 aug 2026`", { parse_mode: "Markdown" });
        }
        const dayRange = reportService.getStartAndEndOfDay(query);
        if (!dayRange) {
            return bot.sendMessage(chatId, `❌ Could not parse date "${query}". Example formats: \`2026-08-02\`, \`2 aug 2026\`.`, { parse_mode: "Markdown" });
        }
        try {
            const formattedDateStr = dayRange.startDate.toISOString().split('T')[0];
            bot.sendMessage(chatId, `🔍 Fetching all records & reports for *${formattedDateStr}*...`, { parse_mode: "Markdown" });
            const [report, productsRes, salesRes, expensesRes] = await Promise.all([
                reportService.getProfitAndLoss(undefined, undefined, formattedDateStr),
                productService.getProducts(1, 10, undefined, undefined, "desc", formattedDateStr),
                saleService.getSales(1, 10, undefined, undefined, "desc", formattedDateStr),
                expenseService.getExpenses(1, 10, undefined, undefined, "desc", formattedDateStr)
            ]);
            let message = `📅 *Shop Summary for ${formattedDateStr}*\n------------------------\n`;
            message += `💰 *Revenue:* ₹${report.totalRevenue}\n`;
            message += `📦 *COGS:* ₹${report.totalCOGS}\n`;
            message += `📉 *Expenses:* ₹${report.totalExpenses}\n`;
            message += `🏆 *Net Profit:* ₹${report.netProfit}\n------------------------\n\n`;
            message += `📦 *Products Added (${productsRes.total}):*\n`;
            if (productsRes.data.length === 0)
                message += `   None\n`;
            else
                productsRes.data.forEach((p) => message += `   • ${p.name} (Stock: ${p.stock})\n`);
            message += `\n📈 *Sales Logged (${salesRes.total}):*\n`;
            if (salesRes.data.length === 0)
                message += `   None\n`;
            else
                salesRes.data.forEach((s) => message += `   • Sale #${s.id} - ₹${s.totalAmount}\n`);
            message += `\n📉 *Expenses Logged (${expensesRes.total}):*\n`;
            if (expensesRes.data.length === 0)
                message += `   None\n`;
            else
                expensesRes.data.forEach((e) => message += `   • ${e.title} - ₹${e.amount}\n`);
            bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
        }
        catch (error) {
            console.error(error);
            bot.sendMessage(chatId, "❌ Failed to fetch date report.");
        }
    });
    // -------------------------------------------------------------
    // LIST PRODUCTS WITH DATE & SORTING (/products [date|asc|desc])
    // -------------------------------------------------------------
    bot.onText(/\/products(?:\s+(.+))?$/i, async (msg, match) => {
        const chatId = msg.chat.id;
        const param = match?.[1]?.trim();
        let sortOrder = "desc";
        let filterDate = undefined;
        if (param) {
            if (param.toLowerCase() === "asc")
                sortOrder = "asc";
            else if (param.toLowerCase() === "desc")
                sortOrder = "desc";
            else {
                const dayRange = reportService.getStartAndEndOfDay(param);
                if (dayRange)
                    filterDate = dayRange.startDate.toISOString().split('T')[0];
            }
        }
        try {
            const result = await productService.getProducts(1, 15, undefined, undefined, sortOrder, filterDate);
            if (!result.data || result.data.length === 0) {
                return bot.sendMessage(chatId, `📦 No products found${filterDate ? ` for date ${filterDate}` : ''}.`);
            }
            let message = `📋 *Products Inventory (${filterDate ? `Date: ${filterDate}` : sortOrder === "asc" ? "Oldest First ⬆️" : "Newest First ⬇️"}):*\n\n`;
            result.data.forEach((p) => {
                const dateStr = new Date(p.createdAt).toLocaleDateString();
                const updatedStr = p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : "—";
                message += `🔹 *ID:* \`${p.id}\` | *${p.name}*\n   Category: ${p.category || '—'}\n   Sell: ₹${p.sellingPrice} | Cost: ₹${p.costPrice}\n   Stock: ${p.stock} pcs\n   📅 Created: ${dateStr} | Updated: ${updatedStr}\n\n`;
            });
            bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
        }
        catch (error) {
            console.error(error);
            bot.sendMessage(chatId, "❌ Failed to fetch products.");
        }
    });
    // -------------------------------------------------------------
    // VIEW SINGLE PRODUCT BY ID/NAME (/product <id_or_name>)
    // -------------------------------------------------------------
    bot.onText(/\/product(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const query = match?.[1]?.trim();
        if (!query) {
            return bot.sendMessage(chatId, "⚠️ Usage: `/product <id_or_name>`", { parse_mode: "Markdown" });
        }
        try {
            let product = await prisma.product.findUnique({ where: { id: query } });
            if (!product) {
                const products = await prisma.product.findMany({
                    where: { name: { contains: query, mode: "insensitive" } }
                });
                product = products[0] || null;
            }
            if (!product) {
                return bot.sendMessage(chatId, `❌ No product found for "${query}".`);
            }
            const message = `📦 *Product Details*\n\n*ID:* \`${product.id}\`\n*Name:* ${product.name}\n*Category:* ${product.category}\n*Selling Price:* ₹${product.sellingPrice}\n*Cost Price:* ₹${product.costPrice}\n*Stock Left:* ${product.stock}\n*Created:* ${new Date(product.createdAt).toLocaleDateString()}\n*Updated:* ${product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : '—'}`;
            bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
        }
        catch (error) {
            console.error(error);
            bot.sendMessage(chatId, "❌ Failed to fetch product details.");
        }
    });
    // -------------------------------------------------------------
    // LIST SALES WITH DATE & SORTING (/sales [date|asc|desc])
    // -------------------------------------------------------------
    bot.onText(/\/sales(?:\s+(.+))?$/i, async (msg, match) => {
        const chatId = msg.chat.id;
        const param = match?.[1]?.trim();
        let sortOrder = "desc";
        let filterDate = undefined;
        if (param) {
            if (param.toLowerCase() === "asc")
                sortOrder = "asc";
            else if (param.toLowerCase() === "desc")
                sortOrder = "desc";
            else {
                const dayRange = reportService.getStartAndEndOfDay(param);
                if (dayRange)
                    filterDate = dayRange.startDate.toISOString().split('T')[0];
            }
        }
        try {
            const result = await saleService.getSales(1, 15, undefined, undefined, sortOrder, filterDate);
            if (!result.data || result.data.length === 0) {
                return bot.sendMessage(chatId, `📈 No sales recorded${filterDate ? ` for date ${filterDate}` : ''}.`);
            }
            let message = `📊 *Sales List (${filterDate ? `Date: ${filterDate}` : sortOrder === "asc" ? "Oldest First ⬆️" : "Newest First ⬇️"}):*\n\n`;
            result.data.forEach((s) => {
                const dateStr = new Date(s.createdAt).toLocaleString();
                const itemDetails = s.items.map((i) => `• ${i.quantity}x ${i.product?.name || 'Item'} | SP: ₹${i.sellingPrice} | CP: ₹${i.costPrice}`).join('\n   ');
                message += `🔹 *ID:* \`${s.id}\` | *Total:* ₹${s.totalAmount}\n   Payment: ${s.paymentMethod}\n   Items:\n   ${itemDetails}\n   📅 Date: ${dateStr}\n\n`;
            });
            bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
        }
        catch (error) {
            console.error(error);
            bot.sendMessage(chatId, "❌ Failed to fetch sales records.");
        }
    });
    // -------------------------------------------------------------
    // LIST EXPENSES WITH DATE & SORTING (/expenses [date|asc|desc])
    // -------------------------------------------------------------
    bot.onText(/\/expenses(?:\s+(.+))?$/i, async (msg, match) => {
        const chatId = msg.chat.id;
        const param = match?.[1]?.trim();
        let sortOrder = "desc";
        let filterDate = undefined;
        if (param) {
            if (param.toLowerCase() === "asc")
                sortOrder = "asc";
            else if (param.toLowerCase() === "desc")
                sortOrder = "desc";
            else {
                const dayRange = reportService.getStartAndEndOfDay(param);
                if (dayRange)
                    filterDate = dayRange.startDate.toISOString().split('T')[0];
            }
        }
        try {
            const result = await expenseService.getExpenses(1, 15, undefined, undefined, sortOrder, filterDate);
            if (!result.data || result.data.length === 0) {
                return bot.sendMessage(chatId, `📉 No expenses recorded${filterDate ? ` for date ${filterDate}` : ''}.`);
            }
            let message = `📋 *Expenses List (${filterDate ? `Date: ${filterDate}` : sortOrder === "asc" ? "Oldest First ⬆️" : "Newest First ⬇️"}):*\n\n`;
            result.data.forEach((e) => {
                const dateStr = new Date(e.createdAt).toLocaleDateString();
                const notes = e.notes ? `\n   Notes: ${e.notes}` : '';
                message += `🔹 *ID:* \`${e.id}\` | *${e.title}*\n   Category: ${e.category || '—'}\n   Amount: ₹${e.amount}${notes}\n   📅 Date: ${dateStr}\n\n`;
            });
            bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
        }
        catch (error) {
            console.error(error);
            bot.sendMessage(chatId, "❌ Failed to fetch expenses records.");
        }
    });
    // -------------------------------------------------------------
    // PROFIT REPORT (/profit [date|month year])
    // -------------------------------------------------------------
    bot.onText(/\/profit(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const param = match?.[1]?.trim();
        let month = undefined;
        let year = undefined;
        let filterDate = undefined;
        if (param) {
            const dayRange = reportService.getStartAndEndOfDay(param);
            if (dayRange) {
                filterDate = dayRange.startDate.toISOString().split('T')[0];
            }
            else {
                const parts = param.split(/\s+/);
                if (parts[0] && !isNaN(Number(parts[0])))
                    month = parseInt(parts[0]);
                if (parts[1] && !isNaN(Number(parts[1])))
                    year = parseInt(parts[1]);
                else if (month)
                    year = new Date().getFullYear();
            }
        }
        try {
            const dateText = filterDate ? ` for Date: ${filterDate}` : (month && year ? ` for ${month}/${year}` : " (All Time)");
            bot.sendMessage(chatId, `📊 Calculating your Profit & Loss${dateText}...`);
            const report = await reportService.getProfitAndLoss(month, year, filterDate);
            const message = `
*📈 Shop Profit & Loss Report${dateText}*
------------------------
*Revenue:* ₹ ${report.totalRevenue}
*COGS:* ₹ ${report.totalCOGS}
*Gross Profit:* ₹ ${report.grossProfit}
*Expenses:* ₹ ${report.totalExpenses}
------------------------
*💰 Net Profit:* ₹ ${report.netProfit}

*📈 Investment Summary*
*Total Invested (Initial Costs):* ₹ ${report.totalInitialCosts}
*Current Inventory Value:* ₹ ${report.totalInventoryValue}
      `;
            bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
        }
        catch (error) {
            console.error(error);
            bot.sendMessage(chatId, "❌ Failed to calculate profit report.");
        }
    });
    // -------------------------------------------------------------
    // DELETE PRODUCT (/deleteproduct <id_or_name>)
    // -------------------------------------------------------------
    bot.onText(/\/deleteproduct(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const query = match?.[1]?.trim();
        if (!query) {
            return bot.sendMessage(chatId, "⚠️ Usage: `/deleteproduct <id_or_name>`", { parse_mode: "Markdown" });
        }
        try {
            let product = await prisma.product.findFirst({ where: { id: query, isActive: true } });
            if (!product) {
                const found = await prisma.product.findMany({
                    where: { name: { contains: query, mode: "insensitive" }, isActive: true }
                });
                product = found[0] || null;
            }
            if (!product) {
                return bot.sendMessage(chatId, `❌ No product found for "${query}".`);
            }
            await productService.deleteProduct(String(product.id));
            bot.sendMessage(chatId, `✅ Product *${product.name}* (ID: \`${product.id}\`) deleted successfully.`, { parse_mode: "Markdown" });
        }
        catch (error) {
            console.error(error);
            bot.sendMessage(chatId, `❌ Failed to delete product: ${error.message}`);
        }
    });
    // -------------------------------------------------------------
    // DELETE EXPENSE (/deleteexpense <id>)
    // -------------------------------------------------------------
    bot.onText(/\/deleteexpense(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const id = match?.[1]?.trim();
        if (!id) {
            return bot.sendMessage(chatId, "⚠️ Usage: `/deleteexpense <id>`", { parse_mode: "Markdown" });
        }
        try {
            await expenseService.deleteExpense(id);
            bot.sendMessage(chatId, `✅ Expense \`${id}\` deleted successfully.`, { parse_mode: "Markdown" });
        }
        catch (error) {
            console.error(error);
            bot.sendMessage(chatId, `❌ Failed to delete expense: ${error.message}`);
        }
    });
    // -------------------------------------------------------------
    // DELETE SALE (/deletesale <id>)
    // -------------------------------------------------------------
    bot.onText(/\/deletesale(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const id = match?.[1]?.trim();
        if (!id) {
            return bot.sendMessage(chatId, "⚠️ Usage: `/deletesale <id>`", { parse_mode: "Markdown" });
        }
        try {
            await saleService.deleteSale(id);
            bot.sendMessage(chatId, `✅ Sale \`${id}\` deleted successfully and stock restored.`, { parse_mode: "Markdown" });
        }
        catch (error) {
            console.error(error);
            bot.sendMessage(chatId, `❌ Failed to delete sale: ${error.message}`);
        }
    });
    // -------------------------------------------------------------
    // VIEW PRODUCT (/product <id_or_name>)
    // -------------------------------------------------------------
    bot.onText(/\/product(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const query = match?.[1]?.trim();
        if (!query) {
            return bot.sendMessage(chatId, "⚠️ Usage: `/product <id_or_name>`", { parse_mode: "Markdown" });
        }
        try {
            let product = await prisma.product.findFirst({
                where: { id: query, isActive: true },
                include: { saleItems: { select: { quantity: true, costPrice: true } } }
            });
            if (!product) {
                const found = await prisma.product.findMany({
                    where: { name: { contains: query, mode: "insensitive" }, isActive: true },
                    include: { saleItems: { select: { quantity: true, costPrice: true } } }
                });
                product = found[0] || null;
            }
            if (!product) {
                return bot.sendMessage(chatId, `❌ No product found for "${query}".`);
            }
            const inventoryValue = Number(product.costPrice) * product.stock;
            const potentialRevenue = Number(product.sellingPrice) * product.stock;
            const potentialProfit = potentialRevenue - inventoryValue;
            const soldStockCost = product.saleItems?.reduce((sum, item) => sum + (Number(item.costPrice) * item.quantity), 0) || 0;
            const totalInitialCost = inventoryValue + soldStockCost;
            const message = `
*📦 Product Details*
------------------------
*Name:* ${product.name}
*Category:* ${product.category || '—'}
*ID:* \`${product.id}\`
------------------------
*Stock:* ${product.stock} units
*Cost Price:* ₹${product.costPrice}
*Selling Price:* ₹${product.sellingPrice}
*Margin/Unit:* ₹${Number(product.sellingPrice) - Number(product.costPrice)}
------------------------
*💰 Financials*
*Total Invested:* ₹${totalInitialCost}
*Current Inv Value:* ₹${inventoryValue}
*Potential Revenue:* ₹${potentialRevenue}
*Potential Profit:* ₹${potentialProfit}
      `;
            bot.sendMessage(chatId, message, {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🕒 View History", callback_data: `product_history_${product.id}` }]
                    ]
                }
            });
        }
        catch (error) {
            console.error(error);
            bot.sendMessage(chatId, `❌ Failed to fetch product: ${error.message}`);
        }
    });
    // -------------------------------------------------------------
    // VIEW SALE (/sale <id>)
    // -------------------------------------------------------------
    bot.onText(/\/sale(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const id = match?.[1]?.trim();
        if (!id) {
            return bot.sendMessage(chatId, "⚠️ Usage: `/sale <id>`", { parse_mode: "Markdown" });
        }
        try {
            const sale = await prisma.sale.findUnique({
                where: { id },
                include: { items: { include: { product: true } } }
            });
            if (!sale) {
                return bot.sendMessage(chatId, `❌ No sale found with ID "${id}".`);
            }
            const totalQuantity = sale.items.reduce((sum, i) => sum + i.quantity, 0);
            const totalCost = sale.items.reduce((sum, i) => sum + (Number(i.costPrice || 0) * i.quantity), 0);
            const saleProfit = Number(sale.totalAmount) - totalCost;
            let itemsText = '';
            sale.items.forEach((item, idx) => {
                itemsText += `• ${item.product?.name || 'Unknown'}: ${item.quantity} x ₹${item.sellingPrice} = ₹${(Number(item.sellingPrice || 0) * item.quantity)}\n`;
            });
            const message = `
*🛒 Sale Details*
------------------------
*Sale ID:* \`${sale.id}\`
*Date:* ${new Date(sale.createdAt).toLocaleString()}
*Payment:* ${sale.paymentMethod}
------------------------
*Items Sold:* ${totalQuantity}
*Total Amount:* ₹${sale.totalAmount}
*Sale Profit:* ₹${saleProfit}
------------------------
*Items:*
${itemsText}
      `;
            bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
        }
        catch (error) {
            console.error(error);
            bot.sendMessage(chatId, `❌ Failed to fetch sale: ${error.message}`);
        }
    });
    // -------------------------------------------------------------
    // BULK UPLOAD HANDLER (bot.on('document'))
    // -------------------------------------------------------------
    bot.on('document', async (msg) => {
        const chatId = msg.chat.id;
        const document = msg.document;
        if (!document)
            return;
        // Check if it's Excel or CSV
        const mime = document.mime_type;
        const isExcelOrCSV = mime === "text/csv" ||
            mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            mime === "application/vnd.ms-excel" ||
            document.file_name?.endsWith(".csv") ||
            document.file_name?.endsWith(".xlsx");
        if (!isExcelOrCSV) {
            bot.sendMessage(chatId, "⚠️ Please upload a valid Excel (.xlsx) or CSV (.csv) file.");
            return;
        }
        bot.sendMessage(chatId, "📁 Received your file! What kind of data is this?", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📦 Products", callback_data: `upload_products_${document.file_id}` }],
                    [{ text: "🛒 Sales", callback_data: `upload_sales_${document.file_id}` }],
                    [{ text: "💸 Expenses", callback_data: `upload_expenses_${document.file_id}` }],
                    [{ text: "❌ Cancel", callback_data: `upload_cancel` }]
                ]
            }
        });
    });
    bot.on('callback_query', async (query) => {
        const chatId = query.message?.chat.id;
        if (!chatId || !query.data)
            return;
        if (query.data === 'upload_cancel') {
            bot.answerCallbackQuery(query.id);
            bot.editMessageText("❌ Upload cancelled.", { chat_id: chatId, message_id: query.message?.message_id });
            return;
        }
        if (query.data.startsWith('upload_')) {
            bot.answerCallbackQuery(query.id);
            bot.editMessageText("⏳ Downloading and processing your file...", { chat_id: chatId, message_id: query.message?.message_id });
            const typeStr = query.data.split('_')[1]; // products, sales, or expenses
            const fileId = query.data.split('_').slice(2).join('_');
            try {
                const fileLink = await bot.getFileLink(fileId);
                const response = await fetch(fileLink);
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const workbook = xlsx.read(buffer, { type: "buffer" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = xlsx.utils.sheet_to_json(sheet);
                if (!rows || rows.length === 0) {
                    bot.sendMessage(chatId, "❌ The uploaded file is empty.");
                    return;
                }
                let result = null;
                const errors = [];
                if (typeStr === "products") {
                    const products = rows.map((row) => ({
                        name: row.name ? String(row.name).trim() : "",
                        category: row.category ? String(row.category).trim() : "Uncategorized",
                        costPrice: Number(row.costPrice) || 0,
                        sellingPrice: Number(row.sellingPrice) || 0,
                        stock: parseInt(row.stock) || 0
                    })).filter(p => p.name.length > 0);
                    if (products.length === 0)
                        throw new Error("No valid products found.");
                    result = await productService.bulkCreateProducts(products);
                }
                else if (typeStr === "expenses") {
                    const expenses = rows.map((row) => ({
                        title: row.title ? String(row.title).trim() : "",
                        category: row.category ? String(row.category).trim() : "Uncategorized",
                        amount: Number(row.amount) || 0,
                        notes: row.notes ? String(row.notes).trim() : ""
                    })).filter(e => e.title.length > 0 && e.amount > 0);
                    if (expenses.length === 0)
                        throw new Error("No valid expenses found.");
                    result = await expenseService.bulkCreateExpenses(expenses);
                }
                else if (typeStr === "sales") {
                    const salesToCreate = [];
                    for (let i = 0; i < rows.length; i++) {
                        const row = rows[i];
                        const productName = row.productName ? String(row.productName).trim() : "";
                        const quantity = parseInt(row.quantity);
                        const paymentMethod = row.paymentMethod ? String(row.paymentMethod).trim() : "Cash";
                        if (!productName || isNaN(quantity) || quantity <= 0) {
                            errors.push(`Row ${i + 1}: Missing/invalid productName or quantity`);
                            continue;
                        }
                        const found = await prisma.product.findMany({ where: { name: { contains: productName, mode: "insensitive" }, isActive: true } });
                        if (!found[0]) {
                            errors.push(`Row ${i + 1}: Product "${productName}" does not exist.`);
                            continue;
                        }
                        salesToCreate.push({
                            paymentMethod,
                            totalAmount: Number(found[0].sellingPrice) * quantity,
                            items: [{ productId: found[0].id, quantity, costPrice: found[0].costPrice, sellingPrice: found[0].sellingPrice }]
                        });
                    }
                    if (salesToCreate.length === 0)
                        throw new Error("No valid sales found (all rows had errors or missing products).");
                    result = await saleService.bulkCreateSales(salesToCreate);
                    result.errors.push(...errors);
                    result.failed += errors.length;
                }
                let replyMsg = `✅ **Bulk Upload Complete**\nSuccessfully imported ${result.success} ${typeStr}.\n`;
                if (result.failed > 0) {
                    replyMsg += `⚠️ Failed to import ${result.failed} rows.\n\n*Errors:* \n${result.errors.slice(0, 10).join('\n')}`;
                    if (result.errors.length > 10)
                        replyMsg += `\n...and ${result.errors.length - 10} more.`;
                }
                bot.sendMessage(chatId, replyMsg, { parse_mode: "Markdown" });
            }
            catch (err) {
                bot.sendMessage(chatId, `❌ Failed to process file: ${err.message}`);
            }
        }
        else if (query.data.startsWith('product_history_')) {
            const productId = query.data.split('product_history_')[1];
            bot.answerCallbackQuery(query.id);
            try {
                const history = await productService.getProductHistory(productId);
                if (history.length === 0) {
                    return bot.sendMessage(chatId, "📉 No history records found for this product.");
                }
                let msg = `🕒 *Product History*\n\n`;
                history.forEach(entry => {
                    const dateStr = new Date(entry.createdAt).toLocaleString();
                    msg += `*${dateStr}*\n`;
                    msg += `📦 +${entry.quantityAdded} units added\n`;
                    msg += `💰 CP: ₹${entry.costPrice} | SP: ₹${entry.sellingPrice}\n\n`;
                });
                bot.sendMessage(chatId, msg, { parse_mode: "Markdown" });
            }
            catch (err) {
                console.error(err);
                bot.sendMessage(chatId, "❌ Failed to fetch product history.");
            }
        }
    });
}

import app from "./app.js";
import { initializeBot } from "./modules/bot/bot.service.js";
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    initializeBot();
});

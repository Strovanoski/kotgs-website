// Guild Rules, Code of Conduct & Loot Policies
const GUILD_RULES_DATA = [
    {
        title: "I. The Code of Chivalry & Honor",
        content: "Members of the Knights of the Golden Spoon represent our legacy dating back to 1996. Respect towards shield-brothers, fair play, and zero tolerance for toxic or disruptive behavior are mandatory."
    },
    {
        title: "II. Attendance & Expedition Readiness",
        content: "For scheduled raids and expeditions, please RSVP on the website or Discord at least 24 hours in advance. Bring necessary consumables, reagents, and gear repairs."
    },
    {
        title: "III. Loot Distribution & Crafting Priority",
        content: "1. Main Spec > Off Spec (Need before Greed).\n2. Rare crafting materials and recipes go directly to designated Guild Master Crafters to benefit the entire roster.\n3. Disputed high-tier drops are resolved via Officer Council review."
    },
    {
        title: "IV. Communication & Voice Decorum",
        content: "Keep comms clear during boss encounters and dungeon pushes. Use push-to-talk in raid channels when background noise is present."
    }
];

function renderGuildRulesUI() {
    const container = document.getElementById('rules-content-list');
    if (!container) return;

    container.innerHTML = GUILD_RULES_DATA.map(rule => `
        <div class="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl space-y-3">
            <h3 class="text-xl font-bold font-serif text-gold-400 border-b border-gold-900/30 pb-2">${rule.title}</h3>
            <p class="text-slate-300 text-sm leading-relaxed whitespace-pre-line">${rule.content}</p>
        </div>
    `).join('');
}

window.addEventListener('DOMContentLoaded', () => {
    renderGuildRulesUI();
});

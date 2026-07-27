// Guild Rules, Charter & The Oath of the Golden Spoon
let guildOathText = localStorage.getItem('kotgs_guild_oath') || "";

let guildRulesList = [
    {
        id: "1",
        title: "I. The Code of Chivalry & Honor",
        content: "Members of the Knights of the Golden Spoon represent our legacy dating back to 1996. Respect towards shield-brothers, fair play, and zero tolerance for toxic or disruptive behavior are mandatory."
    },
    {
        id: "2",
        title: "II. Attendance & Expedition Readiness",
        content: "For scheduled raids and expeditions, please RSVP on the website or Discord at least 24 hours in advance. Bring necessary consumables, reagents, and gear repairs."
    },
    {
        id: "3",
        title: "III. Loot Distribution & Crafting Priority",
        content: "1. Main Spec > Off Spec (Need before Greed).\n2. Rare crafting materials and recipes go directly to designated Guild Master Crafters to benefit the entire roster.\n3. Disputed high-tier drops are resolved via Officer Council review."
    },
    {
        id: "4",
        title: "IV. Communication & Voice Decorum",
        content: "Keep comms clear during boss encounters and dungeon pushes. Use push-to-talk in raid channels when background noise is present."
    }
];

async function fetchRulesAndOathFromSupabase() {
    try {
        const { data: oathData, error } = await supabaseClient
            .from('guild_settings')
            .select('*')
            .eq('key', 'guild_oath')
            .maybeSingle();

        if (oathData && oathData.value) {
            guildOathText = oathData.value;
            localStorage.setItem('kotgs_guild_oath', oathData.value);
        }
    } catch (e) {
        console.error("Error fetching oath from Supabase:", e);
    }

    try {
        const { data: rulesData } = await supabaseClient
            .from('guild_rules')
            .select('*')
            .order('id', { ascending: true });

        if (rulesData && rulesData.length > 0) {
            guildRulesList = rulesData;
        }
    } catch (e) {
        console.error("Error fetching rules from Supabase:", e);
    }

    renderOathUI();
    renderGuildRulesUI();
    populateOfficerCharterForm();
}

function renderOathUI() {
    document.querySelectorAll('.oath-quote-text').forEach(el => {
        el.textContent = guildOathText;
    });
}

function renderGuildRulesUI() {
    const container = document.getElementById('rules-content-list');
    if (!container) return;

    container.innerHTML = guildRulesList.map(rule => `
        <div class="bg-[#0a0f1d] p-6 rounded-xl border border-gold-900/30 shadow-xl space-y-3">
            <h3 class="text-xl font-bold font-serif text-gold-400 border-b border-gold-900/30 pb-2">${rule.title}</h3>
            <p class="text-slate-300 text-sm leading-relaxed whitespace-pre-line">${rule.content}</p>
        </div>
    `).join('');
}

function populateOfficerCharterForm() {
    const oathInput = document.getElementById('officer-edit-oath');
    const charterInput = document.getElementById('officer-edit-charter');

    if (oathInput) oathInput.value = guildOathText;
    if (charterInput) {
        charterInput.value = guildRulesList.map(r => `${r.title}\n${r.content}`).join('\n\n---\n\n');
    }
}

async function saveOathAndCharterFromOfficer() {
    const newOath = document.getElementById('officer-edit-oath')?.value.trim();
    const charterRaw = document.getElementById('officer-edit-charter')?.value.trim();

    if (!newOath) {
        showNotification("Oath content cannot be empty.", "error");
        return;
    }

    showNotification("Saving Oath & Charter changes...");

    guildOathText = newOath;
    localStorage.setItem('kotgs_guild_oath', newOath);

    const { error: oathError } = await supabaseClient
        .from('guild_settings')
        .upsert({ key: 'guild_oath', value: newOath }, { onConflict: 'key' });

    if (oathError) {
        console.error("Supabase Oath Save Error:", oathError);
        showNotification("Oath saved locally (Supabase table error: " + oathError.message + ")", "error");
    } else {
        showNotification("Guild Oath and Charter updated successfully!");
    }

    if (charterRaw) {
        const blocks = charterRaw.split('\n\n---\n\n');
        guildRulesList = blocks.map((b, idx) => {
            const lines = b.trim().split('\n');
            return {
                id: String(idx + 1),
                title: lines[0] || `Section ${idx + 1}`,
                content: lines.slice(1).join('\n')
            };
        });

        try {
            await supabaseClient.from('guild_rules').delete().neq('id', '0');
            await supabaseClient.from('guild_rules').insert(guildRulesList.map(r => ({
                title: r.title,
                content: r.content
            })));
        } catch (e) {
            console.error("Supabase Charter Save Error:", e);
        }
    }

    renderOathUI();
    renderGuildRulesUI();
}

window.addEventListener('DOMContentLoaded', () => {
    fetchRulesAndOathFromSupabase();
});

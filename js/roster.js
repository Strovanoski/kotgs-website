// Member Roster, Recruitment Priorities & Application Forms
let dbRoster = [];
let priorities = {};

async function fetchRosterFromSupabase() {
    const container = document.getElementById('roster-grid');
    if (container) {
        container.innerHTML = `<div class="col-span-full text-center py-8 text-slate-500 italic">Fetching live roster from Supabase...</div>`;
    }

    const { data, error } = await supabaseClient
        .from('guild_members')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching roster:", error.message);
        if (container) {
            container.innerHTML = `<div class="col-span-full text-center py-8 text-red-400">Error loading roster: ${error.message}</div>`;
        }
        return;
    }

    dbRoster = data ? data.map(m => ({
        id: m.id,
        name: m.in_game_name,
        class: m.character_class || "Fighter",
        level: m.character_level || 1,
        rank: m.role || "Squire",
        focus: m.focus || "PvE Dungeons",
        discord: m.username || m.discord_id || "N/A"
    })) : [];

    renderRosterUI();
    renderOfficerRosterManagerUI(data || []);
}

function renderRosterUI() {
    const container = document.getElementById('roster-grid');
    if (!container) return;
    container.innerHTML = "";

    const searchVal = document.getElementById('roster-search')?.value.toLowerCase() || "";
    const classFilter = document.getElementById('roster-class-filter')?.value || "All";
    const rankFilter = document.getElementById('roster-rank-filter')?.value || "All";

    const filtered = dbRoster.filter(mem => {
        const matchSearch = mem.name.toLowerCase().includes(searchVal);
        const matchClass = classFilter === "All" || mem.class === classFilter;
        const matchRank = rankFilter === "All" || mem.rank === rankFilter;
        return matchSearch && matchClass && matchRank;
    });

    if (filtered.length === 0) {
        document.getElementById('roster-empty-state')?.classList.remove('hidden');
        return;
    } else {
        document.getElementById('roster-empty-state')?.classList.add('hidden');
    }

    filtered.forEach(m => {
        let rankStyle = "text-slate-400 border-slate-800 bg-slate-950";
        if (m.rank === "Grandmaster") rankStyle = "text-gold-400 border-gold-800/40 bg-gold-950/30";
        if (m.rank === "Knight-Commander") rankStyle = "text-amber-500 border-amber-900/40 bg-amber-950/30";
        if (m.rank === "Knight") rankStyle = "text-indigo-400 border-indigo-900/40 bg-indigo-950/30";

        const card = document.createElement('div');
        card.className = "bg-slate-900 p-5 rounded-xl border border-slate-850 flex flex-col justify-between hover:border-gold-900/30 transition-all";
        card.innerHTML = `
            <div>
                <div class="flex items-start justify-between">
                    <h4 class="text-lg font-bold text-slate-100 font-serif">${m.name}</h4>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded border ${rankStyle}">${m.rank}</span>
                </div>
                <div class="mt-4 space-y-1 text-xs">
                    <div class="flex justify-between text-slate-400">
                        <span>Class:</span>
                        <span class="text-slate-200 font-medium">${m.class}</span>
                    </div>
                    <div class="flex justify-between text-slate-400">
                        <span>Focus:</span>
                        <span class="text-slate-200 font-medium">${m.focus}</span>
                    </div>
                </div>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[10px]">
                <span class="text-slate-500 font-mono">${m.discord}</span>
                <span class="text-gold-500 font-semibold font-serif">LVL ${m.level || '1'}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderOfficerRosterManagerUI(members) {
    const container = document.getElementById('officer-roster-manager-list');
    if (!container) return;

    if (members.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-sm italic">No members in database.</p>`;
        return;
    }

    container.innerHTML = members.map(m => `
        <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
                <span class="text-slate-100 font-bold">${m.in_game_name}</span>
                <span class="text-slate-400">(${m.character_class || 'Fighter'} LVL ${m.character_level || 1})</span>
                <span class="text-slate-500 block text-[10px] font-mono">Discord: ${m.username || m.discord_id || 'N/A'}</span>
            </div>
            <div class="flex items-center space-x-2">
                <select onchange="updateMemberRoleInSupabase('${m.id}', this.value)" class="bg-slate-900 border border-slate-800 text-xs rounded px-2 py-1 text-gold-400">
                    <option value="Grandmaster" ${m.role === 'Grandmaster' ? 'selected' : ''}>Grandmaster</option>
                    <option value="Knight-Commander" ${m.role === 'Knight-Commander' ? 'selected' : ''}>Knight-Commander</option>
                    <option value="Knight" ${m.role === 'Knight' ? 'selected' : ''}>Knight</option>
                    <option value="Squire" ${m.role === 'Squire' ? 'selected' : ''}>Squire</option>
                </select>
                <button onclick="deleteMemberInSupabase('${m.id}')" class="px-2.5 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 rounded border border-red-800/40">
                    Remove
                </button>
            </div>
        </div>
    `).join('');
}

async function updateMemberRoleInSupabase(memberId, newRole) {
    const { error } = await supabaseClient
        .from('guild_members')
        .update({ role: newRole })
        .eq('id', memberId);

    if (error) {
        showNotification("Error updating member rank: " + error.message, "error");
    } else {
        showNotification("Member rank updated!");
        await fetchRosterFromSupabase();
    }
}

async function deleteMemberInSupabase(memberId) {
    if (!confirm("Are you sure you want to remove this member from the roster?")) return;

    const { error } = await supabaseClient
        .from('guild_members')
        .delete()
        .eq('id', memberId);

    if (error) {
        showNotification("Error removing member: " + error.message, "error");
    } else {
        showNotification("Member removed from roster.");
        await fetchRosterFromSupabase();
    }
}

function filterRoster() {
    renderRosterUI();
}

async function fetchClassPrioritiesFromSupabase() {
    const { data, error } = await supabaseClient
        .from('class_priorities')
        .select('*');

    if (error) {
        console.error("Error fetching priorities:", error.message);
        return;
    }

    priorities = {};
    if (data) {
        data.forEach(item => {
            priorities[item.class_name] = item.priority_level;
        });
    }

    renderRecruitmentNeedsUI();
    renderOfficerPrioritiesUI();
}

function renderRecruitmentNeedsUI() {
    const container = document.getElementById('recruitment-needs-list');
    if (!container) return;
    container.innerHTML = "";

    const sorted = Object.entries(priorities).sort((a, b) => {
        const map = { "High": 3, "Medium": 2, "Low": 1 };
        return (map[b[1]] || 0) - (map[a[1]] || 0);
    });

    if (sorted.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-sm italic">All class roles open.</p>`;
        return;
    }

    sorted.forEach(([cls, prio]) => {
        let badgeClass = "bg-red-950/80 border-red-800/50 text-red-400";
        if (prio === "Medium") badgeClass = "bg-amber-950/80 border-amber-800/50 text-amber-400";
        if (prio === "Low") badgeClass = "bg-slate-900 border-slate-800 text-slate-400";

        const row = document.createElement('div');
        row.className = "flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800";
        row.innerHTML = `
            <span class="text-sm font-medium text-slate-200">${cls}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${badgeClass}">${prio.toUpperCase()}</span>
        `;
        container.appendChild(row);
    });
}

function renderOfficerPrioritiesUI() {
    const container = document.getElementById('officer-priority-list');
    if (!container) return;
    container.innerHTML = "";

    MM_CLASSES.forEach(cls => {
        const val = priorities[cls] || "Low";
        const row = document.createElement('div');
        row.className = "flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-900 text-sm";
        row.innerHTML = `
            <span class="text-slate-300">${cls}</span>
            <div class="flex items-center space-x-2">
                <select onchange="updateClassPriority('${cls}', this.value)" class="bg-slate-900 border border-slate-800 text-[11px] rounded px-2 py-1 text-slate-300">
                    <option value="High" ${val === 'High' ? 'selected' : ''}>High</option>
                    <option value="Medium" ${val === 'Medium' ? 'selected' : ''}>Medium</option>
                    <option value="Low" ${val === 'Low' ? 'selected' : ''}>Low</option>
                </select>
            </div>
        `;
        container.appendChild(row);
    });
}

async function updateClassPriority(className, priorityLevel) {
    showNotification(`Updating ${className} priority...`);

    const { error } = await supabaseClient
        .from('class_priorities')
        .upsert({ class_name: className, priority_level: priorityLevel }, { onConflict: 'class_name' });

    if (error) {
        showNotification("Error updating priority: " + error.message, "error");
    } else {
        showNotification(`Updated priority for ${className} to ${priorityLevel}.`);
        await fetchClassPrioritiesFromSupabase();
    }
}

async function handleRecruitmentSubmit(event) {
    event.preventDefault();

    const nameInput = document.getElementById('app-char-name');
    const classInput = document.getElementById('app-class');
    const levelInput = document.getElementById('app-level');
    const focusInput = document.getElementById('app-focus');
    const discordInput = document.getElementById('app-discord');
    const bioInput = document.getElementById('app-bio');

    const charName = nameInput.value.trim();
    const charClass = classInput.value;
    const charLevel = parseInt(levelInput.value) || 1;
    const focus = focusInput.value;
    const discordTag = discordInput.value.trim();
    const bio = bioInput.value.trim() || "No historic stories recorded.";

    showNotification("Submitting application...");

    const { error } = await supabaseClient
        .from('applications')
        .insert([{
            applicant_discord_id: discordTag,
            applicant_username: discordTag,
            character_name: charName,
            character_class: charClass,
            character_level: charLevel,
            experience: bio,
            notes: focus
        }]);

    if (error) {
        showNotification("Error saving application: " + error.message, "error");
        return;
    }

    try {
        const embedPayload = {
            embeds: [{
                title: "⚔️ New Guild Application Received!",
                color: 15301131,
                description: `The sacred vow has been sworn by **${charName}** to the Knights of the Golden Spoon.`,
                fields: [
                    { name: "Character Class", value: charClass, inline: true },
                    { name: "Level", value: String(charLevel), inline: true },
                    { name: "Play Focus", value: focus, inline: true },
                    { name: "Discord Contact", value: discordTag, inline: false },
                    { name: "Backstory / Bio", value: bio }
                ],
                footer: { text: "For Justice, Honor, and the Glory of the Golden Spoon!!" },
                timestamp: new Date().toISOString()
            }]
        };

        await fetch(DISCORD_APPLICATIONS_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(embedPayload)
        });
    } catch (e) {
        console.error("Webhook error:", e);
    }

    showNotification("Application submitted successfully!");
    document.getElementById('recruitment-form').reset();
    switchTab('home');
}

async function fetchApplicationsFromSupabase() {
    const container = document.getElementById('pending-applications-list');
    if (!container) return;

    container.innerHTML = `<p class="text-slate-500 text-sm italic">Fetching applications...</p>`;

    const { data, error } = await supabaseClient
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `<p class="text-red-400 text-sm">Error: ${error.message}</p>`;
        return;
    }

    const pendingApps = data ? data.filter(a => a.status === 'pending') : [];

    document.getElementById('nav-badge').textContent = pendingApps.length;
    document.getElementById('app-count-badge').textContent = pendingApps.length;
    if (pendingApps.length > 0) {
        document.getElementById('nav-badge').classList.remove('hidden');
    } else {
        document.getElementById('nav-badge').classList.add('hidden');
    }

    if (!data || data.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-sm italic py-4">No applications found in database.</p>`;
        return;
    }

    container.innerHTML = data.map(app => `
        <div class="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-850 pb-3 gap-2">
                <div>
                    <span class="text-xs text-gold-500 font-semibold uppercase tracking-wider">Applied ${new Date(app.created_at).toLocaleDateString()}</span>
                    <h4 class="text-lg font-bold text-slate-100">${app.character_name}</h4>
                </div>
                <div class="flex flex-wrap gap-2 text-[10px] font-bold">
                    <span class="bg-indigo-950 border border-indigo-900 text-indigo-400 px-2 py-0.5 rounded">${app.character_class}</span>
                    <span class="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded">LVL ${app.character_level}</span>
                    <span class="bg-amber-950 border border-amber-900 text-amber-400 px-2 py-0.5 rounded">${app.status.toUpperCase()}</span>
                </div>
            </div>
            <div>
                <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">Applicant's Chronicle</span>
                <p class="text-slate-300 text-sm whitespace-pre-line leading-relaxed italic bg-slate-900 p-3 rounded border border-slate-850">${app.experience || 'N/A'}</p>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-4">
                <span class="text-xs text-slate-400 font-mono">Discord: <span class="text-slate-200 font-bold">${app.applicant_username || 'N/A'}</span></span>
                ${app.status === 'pending' ? `
                    <div class="flex gap-2">
                        <button onclick="processAppInSupabase('${app.id}', 'approved')" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded transition-all uppercase tracking-wider">
                            Approve & Add as Squire
                        </button>
                        <button onclick="processAppInSupabase('${app.id}', 'rejected')" class="px-4 py-1.5 bg-red-900/50 hover:bg-red-800/80 text-red-200 border border-red-800/40 text-xs rounded transition-all uppercase tracking-wider">
                            Reject
                        </button>
                    </div>
                ` : `<span class="text-xs font-semibold text-slate-500">Status: ${app.status}</span>`}
            </div>
        </div>
    `).join('');
}

async function processAppInSupabase(appId, decision) {
    const { error: appErr } = await supabaseClient
        .from('applications')
        .update({ status: decision })
        .eq('id', appId);

    if (appErr) {
        showNotification("Error updating status: " + appErr.message, "error");
        return;
    }

    if (decision === 'approved') {
        const { data: appData } = await supabaseClient
            .from('applications')
            .select('*')
            .eq('id', appId)
            .single();

        if (appData) {
            await supabaseClient.from('guild_members').insert([{
                discord_id: appData.applicant_discord_id,
                username: appData.applicant_username,
                in_game_name: appData.character_name,
                character_class: appData.character_class,
                character_level: appData.character_level,
                role: 'Squire',
                focus: appData.notes || 'PvE Dungeons'
            }]);
            showNotification(`${appData.character_name} approved and added as Squire!`);
        }
    } else {
        showNotification("Application rejected.");
    }

    fetchApplicationsFromSupabase();
    fetchRosterFromSupabase();
}

async function triggerDiscordRosterSync() {
    if (typeof showNotification === 'function') {
        showNotification("Syncing full Discord server roster...");
    }

    try {
        const res = await fetch("https://zzotvstvmnlmfrulxhvl.supabase.co/functions/v1/sync-discord-roster", {
            headers: {
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        const data = await res.json();
        if (res.ok) {
            showNotification(data.message || "Discord roster synced successfully!", "success");
            if (typeof fetchRosterFromSupabase === 'function') {
                await fetchRosterFromSupabase();
            }
        } else {
            showNotification("Sync failed: " + (data.error || "Unknown error"), "error");
        }
    } catch (err) {
        console.error("Error triggering roster sync:", err);
        showNotification("Sync error: " + err.message, "error");
    }
}

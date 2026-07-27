// Guild Expeditions & Events Calendar
let events = [];
let editingEventId = null;

async function fetchEventsFromSupabase() {
    const { data, error } = await supabaseClient
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching events:", error.message);
        return;
    }

    events = data || [];
    renderEventsUI();
    renderOfficerEventsManagerUI();
}

function renderEventsUI() {
    const container = document.getElementById('events-list');
    if (!container) return;
    container.innerHTML = "";

    if (events.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-sm italic">Peace on the horizon. Check back soon.</p>`;
        return;
    }

    events.forEach(ev => {
        const card = document.createElement('div');
        card.className = "p-3 bg-slate-950 rounded-lg border border-slate-850 hover:border-gold-900/50 transition-colors";
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-gold-500 uppercase tracking-wider">${ev.event_date} @ ${ev.event_time}</span>
            </div>
            <h4 class="text-sm font-bold text-slate-200 mt-1">${ev.title}</h4>
            <p class="text-slate-400 text-[11px] mt-1">${ev.description || ''}</p>
        `;
        container.appendChild(card);
    });
}

function renderOfficerEventsManagerUI() {
    const container = document.getElementById('officer-event-manager-list');
    if (!container) return;

    if (events.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-sm italic">No scheduled expeditions.</p>`;
        return;
    }

    container.innerHTML = events.map(ev => `
        <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div class="truncate">
                <span class="text-gold-500 font-bold">${ev.title}</span>
                <span class="text-slate-400 block text-[10px]">${ev.event_date} @ ${ev.event_time}</span>
            </div>
            <div class="flex gap-2 shrink-0">
                <button onclick="openEditEvent('${ev.id}')" class="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded border border-amber-800/40">
                    Edit
                </button>
                <button onclick="deleteEvent('${ev.id}')" class="px-2.5 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 rounded border border-red-800/40">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

function openEditEvent(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;

    editingEventId = id;
    document.getElementById('event-form-title').textContent = "Edit Scheduled Expedition";
    document.getElementById('new-event-title').value = ev.title || '';
    document.getElementById('new-event-date').value = ev.event_date || '';
    document.getElementById('new-event-time').value = ev.event_time || '';
    document.getElementById('new-event-desc').value = ev.description || '';

    document.getElementById('publish-event-btn').textContent = "Save Expedition Changes";
    document.getElementById('cancel-event-btn').classList.remove('hidden');
}

function cancelEditEvent() {
    editingEventId = null;
    document.getElementById('event-form-title').textContent = "Schedule New Expedition";
    document.getElementById('new-event-title').value = '';
    document.getElementById('new-event-date').value = '';
    document.getElementById('new-event-time').value = '';
    document.getElementById('new-event-desc').value = '';
    document.getElementById('publish-event-btn').textContent = "Publish Expedition";
    document.getElementById('cancel-event-btn').classList.add('hidden');
}

async function addNewEvent() {
    const titleIn = document.getElementById('new-event-title');
    const dateIn = document.getElementById('new-event-date');
    const timeIn = document.getElementById('new-event-time');
    const descIn = document.getElementById('new-event-desc');

    if (!titleIn.value || !dateIn.value) {
        showNotification("Event requires a Title and Date.", "error");
        return;
    }

    if (editingEventId) {
        showNotification("Updating expedition...");
        const { error } = await supabaseClient.from('events').update({
            title: titleIn.value.trim(),
            event_date: dateIn.value.trim(),
            event_time: timeIn.value.trim() || "8:00 PM",
            description: descIn.value.trim() || "Regular excursion parameters."
        }).eq('id', editingEventId);

        if (error) {
            showNotification("Error updating event: " + error.message, "error");
        } else {
            showNotification("Expedition updated successfully!");
            cancelEditEvent();
            await fetchEventsFromSupabase();
        }
    } else {
        showNotification("Publishing expedition...");
        const { error } = await supabaseClient.from('events').insert([{
            title: titleIn.value.trim(),
            event_date: dateIn.value.trim(),
            event_time: timeIn.value.trim() || "8:00 PM",
            description: descIn.value.trim() || "Regular excursion parameters."
        }]);

        if (error) {
            showNotification("Error publishing event: " + error.message, "error");
            return;
        }

        try {
            await fetch(DISCORD_EVENTS_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embeds: [{
                        title: `🗺️ New Expedition Scheduled: ${titleIn.value.trim()}`,
                        color: 5814786,
                        fields: [
                            { name: "Date & Time", value: `${dateIn.value.trim()} @ ${timeIn.value.trim() || '8:00 PM'}`, inline: true },
                            { name: "Objective", value: descIn.value.trim() || "Regular excursion." }
                        ],
                        footer: { text: "KOTGS Events Sergeant" },
                        timestamp: new Date().toISOString()
                    }]
                })
            });
        } catch (e) {
            console.error("Discord alert error:", e);
        }

        showNotification("Upcoming Expedition published live!");
        await fetchEventsFromSupabase();

        titleIn.value = "";
        dateIn.value = "";
        timeIn.value = "";
        descIn.value = "";
    }
}

async function deleteEvent(id) {
    if (!confirm("Are you sure you want to delete this expedition?")) return;

    const { error } = await supabaseClient
        .from('events')
        .delete()
        .eq('id', id);

    if (error) {
        showNotification("Error deleting event: " + error.message, "error");
    } else {
        showNotification("Expedition deleted.");
        await fetchEventsFromSupabase();
    }
}

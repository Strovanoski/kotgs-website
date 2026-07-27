// Guild News Bulletins & Archives
let newsArticles = [];
let editingNewsId = null;

async function fetchNewsFromSupabase() {
    const { data, error } = await supabaseClient
        .from('guild_news')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching news:", error.message);
        return;
    }

    newsArticles = data || [];
    renderHomeNewsUI();
    renderNewsArchiveUI();
    renderOfficerNewsManagerUI();
}

function renderHomeNewsUI() {
    const container = document.getElementById('news-stream-list');
    if (!container) return;

    const top5 = newsArticles.slice(0, 5);

    if (top5.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-sm italic">No recent announcements.</p>`;
        return;
    }

    container.innerHTML = top5.map(news => `
        <div class="border-b border-slate-800/80 pb-6 last:border-0 last:pb-0">
            <div class="flex items-center space-x-2 text-xs text-slate-400 mb-2">
                <span class="font-semibold text-gold-500">${news.category || 'OFFICER BULLETIN'}</span>
                <span>•</span>
                <span>${news.news_date}</span>
            </div>
            <h4 class="text-lg font-bold text-slate-100 hover:text-gold-400 transition-colors">${news.title}</h4>
            <p class="text-slate-400 text-sm mt-2 leading-relaxed whitespace-pre-line">${news.content}</p>
        </div>
    `).join('');
}

function renderNewsArchiveUI() {
    const container = document.getElementById('full-news-archive-list');
    if (!container) return;

    const filterVal = document.getElementById('archive-category-filter')?.value || "All";
    const filtered = newsArticles.filter(n => filterVal === "All" || n.category === filterVal);

    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-sm italic text-center py-12">No bulletins found for this category.</p>`;
        return;
    }

    container.innerHTML = filtered.map(news => `
        <div class="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl space-y-3">
            <div class="flex items-center justify-between border-b border-slate-850 pb-3">
                <span class="font-bold text-xs text-gold-500 tracking-wider">${news.category || 'OFFICER BULLETIN'}</span>
                <span class="text-xs text-slate-500 font-mono">${news.news_date}</span>
            </div>
            <h3 class="text-xl font-bold font-serif text-slate-100">${news.title}</h3>
            <p class="text-slate-300 text-sm leading-relaxed whitespace-pre-line">${news.content}</p>
        </div>
    `).join('');
}

function renderOfficerNewsManagerUI() {
    const container = document.getElementById('officer-news-manager-list');
    if (!container) return;

    if (newsArticles.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-sm italic">No published bulletins.</p>`;
        return;
    }

    container.innerHTML = newsArticles.map(news => `
        <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div class="truncate">
                <span class="text-gold-500 font-semibold">[${news.category}]</span>
                <span class="text-slate-200 font-bold ml-1">${news.title}</span>
                <span class="text-slate-500 block text-[10px]">${news.news_date}</span>
            </div>
            <div class="flex gap-2 shrink-0">
                <button onclick="openEditNews('${news.id}')" class="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded border border-amber-800/40">
                    Edit
                </button>
                <button onclick="deleteNewsArticle('${news.id}')" class="px-2.5 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 rounded border border-red-800/40">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

function openEditNews(id) {
    const article = newsArticles.find(n => n.id === id);
    if (!article) return;

    editingNewsId = id;
    document.getElementById('news-form-title').textContent = "Edit Guild News Bulletin";
    document.getElementById('new-news-category').value = article.category || 'OFFICER BULLETIN';
    document.getElementById('new-news-title').value = article.title || '';
    document.getElementById('new-news-date').value = article.news_date || '';
    document.getElementById('new-news-content').value = article.content || '';

    document.getElementById('publish-news-btn').textContent = "Save Bulletin Changes";
    document.getElementById('cancel-news-btn').classList.remove('hidden');
}

function cancelEditNews() {
    editingNewsId = null;
    document.getElementById('news-form-title').textContent = "Publish Guild News / Bulletin";
    document.getElementById('new-news-title').value = '';
    document.getElementById('new-news-date').value = '';
    document.getElementById('new-news-content').value = '';
    document.getElementById('publish-news-btn').textContent = "Publish News Article";
    document.getElementById('cancel-news-btn').classList.add('hidden');
}

async function addNewNews() {
    const categoryIn = document.getElementById('new-news-category');
    const titleIn = document.getElementById('new-news-title');
    const dateIn = document.getElementById('new-news-date');
    const contentIn = document.getElementById('new-news-content');

    if (!titleIn.value || !contentIn.value) {
        showNotification("News requires a Title and Content.", "error");
        return;
    }

    const todayStr = dateIn.value.trim() || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (editingNewsId) {
        showNotification("Updating news bulletin...");
        const { error } = await supabaseClient.from('guild_news').update({
            category: categoryIn.value,
            title: titleIn.value.trim(),
            news_date: todayStr,
            content: contentIn.value.trim()
        }).eq('id', editingNewsId);

        if (error) {
            showNotification("Error updating news: " + error.message, "error");
        } else {
            showNotification("News bulletin updated successfully!");
            cancelEditNews();
            await fetchNewsFromSupabase();
        }
    } else {
        showNotification("Publishing news bulletin...");
        const { error } = await supabaseClient.from('guild_news').insert([{
            category: categoryIn.value,
            title: titleIn.value.trim(),
            news_date: todayStr,
            content: contentIn.value.trim()
        }]);

        if (error) {
            showNotification("Error publishing news: " + error.message, "error");
            return;
        }

        try {
            await fetch(DISCORD_NEWS_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embeds: [{
                        title: `📢 ${categoryIn.value}: ${titleIn.value.trim()}`,
                        color: 15301131,
                        description: contentIn.value.trim(),
                        footer: { text: "KOTGS News Squire" },
                        timestamp: new Date().toISOString()
                    }]
                })
            });
        } catch (e) {
            console.error("Discord alert error:", e);
        }

        showNotification("Guild news article published live!");
        await fetchNewsFromSupabase();

        titleIn.value = "";
        dateIn.value = "";
        contentIn.value = "";
    }
}

async function deleteNewsArticle(id) {
    if (!confirm("Are you sure you want to delete this news bulletin?")) return;

    const { error } = await supabaseClient
        .from('guild_news')
        .delete()
        .eq('id', id);

    if (error) {
        showNotification("Error deleting news: " + error.message, "error");
    } else {
        showNotification("News bulletin deleted.");
        await fetchNewsFromSupabase();
    }
}

// Authentication & Discord OAuth Sync
async function loginWithDiscord() {
    try {
        console.log("loginWithDiscord initiated...");
        if (typeof showNotification === 'function') {
            showNotification("Connecting to Discord OAuth...", "success");
        }

        if (typeof supabaseClient === 'undefined' || !supabaseClient || !supabaseClient.auth) {
            console.error("Supabase client is not initialized.");
            alert("Error: Supabase client is not initialized. Please check config.js.");
            return;
        }

        const currentRedirect = window.location.origin + window.location.pathname;

        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                redirectTo: currentRedirect,
                scopes: 'identify email guilds.members.read'
            }
        });

        if (error) {
            console.error("Discord OAuth Error:", error);
            if (typeof showNotification === 'function') {
                showNotification("Discord login error: " + error.message, "error");
            } else {
                alert("Login error: " + error.message);
            }
            return;
        }

        // Force browser redirect to Discord OAuth URL if returned
        if (data && data.url) {
            console.log("Redirecting to OAuth URL:", data.url);
            window.location.href = data.url;
        }
    } catch (err) {
        console.error("Unexpected authentication error:", err);
        alert("Authentication error: " + err.message);
    }
}

async function logout() {
    try {
        await supabaseClient.auth.signOut();
        currentUserProfile = null;
        if (typeof showNotification === 'function') {
            showNotification("Signed out successfully.");
        }
        window.location.reload();
    } catch (err) {
        console.error("Error signing out:", err);
    }
}

async function updateAuthUI(session) {
    try {
        const loggedOutHeader = document.getElementById('auth-header-logged-out');
        const loggedInHeader = document.getElementById('auth-header-logged-in');
        const userNameSpan = document.getElementById('header-user-name');
        const profileNavBtn = document.getElementById('nav-profile');
        const mobileProfileBtn = document.getElementById('mobile-nav-profile');
        const officerNavBtn = document.getElementById('nav-officer');
        const mobileOfficerBtn = document.getElementById('mobile-nav-officer');
        const discordHeaderBtn = document.getElementById('discord-header-btn');
        const viewOfficer = document.getElementById('view-officer');
        const viewProfile = document.getElementById('view-profile');

        if (session && session.user) {
            if (loggedOutHeader) loggedOutHeader.classList.add('hidden');
            if (loggedInHeader) loggedInHeader.classList.remove('hidden');
            if (profileNavBtn) profileNavBtn.classList.remove('hidden');
            if (mobileProfileBtn) mobileProfileBtn.classList.remove('hidden');
            if (discordHeaderBtn) discordHeaderBtn.classList.add('hidden');

            const roleData = await checkDiscordRoles(session);
            const isOfficer = roleData.isOfficer || roleData.isGrandmaster;
            const assignedRole = roleData.assignedRole;

            if (userNameSpan) {
                userNameSpan.textContent = session.user.user_metadata?.full_name || 
                                           session.user.user_metadata?.custom_claims?.global_name || 
                                           session.user.email || "Member";
            }

            await syncUserToDatabaseRoster(session, assignedRole);

            if (isOfficer) {
                if (typeof showNotification === 'function') {
                    showNotification("Welcome Officer! Command Center unlocked.", "success");
                }
                if (officerNavBtn) officerNavBtn.classList.remove('hidden');
                if (mobileOfficerBtn) mobileOfficerBtn.classList.remove('hidden');
                if (typeof fetchApplicationsFromSupabase === 'function') {
                    fetchApplicationsFromSupabase();
                }
            } else {
                if (officerNavBtn) officerNavBtn.classList.add('hidden');
                if (mobileOfficerBtn) mobileOfficerBtn.classList.add('hidden');
                if (viewOfficer) viewOfficer.classList.add('hidden');
            }
        } else {
            if (loggedOutHeader) loggedOutHeader.classList.remove('hidden');
            if (loggedInHeader) loggedInHeader.classList.add('hidden');
            if (profileNavBtn) profileNavBtn.classList.add('hidden');
            if (mobileProfileBtn) mobileProfileBtn.classList.add('hidden');
            if (officerNavBtn) officerNavBtn.classList.add('hidden');
            if (mobileOfficerBtn) mobileOfficerBtn.classList.add('hidden');
            if (discordHeaderBtn) discordHeaderBtn.classList.remove('hidden');
            if (viewOfficer) viewOfficer.classList.add('hidden');
            if (viewProfile) viewProfile.classList.add('hidden');
        }
    } catch (err) {
        console.error("Error in updateAuthUI:", err);
    }
}

async function checkDiscordRoles(session) {
    if (!session) return { assignedRole: 'Squire', isOfficer: false, isGrandmaster: false };

    const providerToken = session.provider_token;
    if (!providerToken || !DISCORD_GUILD_ID) {
        return { assignedRole: 'Squire', isOfficer: false, isGrandmaster: false };
    }

    try {
        const response = await fetch(`https://discord.com/api/v10/users/@me/guilds/${DISCORD_GUILD_ID}/member`, {
            headers: { Authorization: `Bearer ${providerToken}` }
        });

        if (!response.ok) return { assignedRole: 'Squire', isOfficer: false, isGrandmaster: false };

        const memberData = await response.json();
        const userRoles = memberData.roles || [];

        const ROLE_IDS = {
            GRANDMASTER: "1531247534104907919",
            OFFICER: "1531248101573136474",
            KNIGHT: "1531249654715519088",
            SQUIRE: "1531285376730398872",
            APPLICANT: "1531286196653789298"
        };

        let assignedRole = 'Squire';
        if (userRoles.includes(ROLE_IDS.GRANDMASTER)) {
            assignedRole = 'Grandmaster';
        } else if (userRoles.includes(ROLE_IDS.OFFICER)) {
            assignedRole = 'Knight-Commander';
        } else if (userRoles.includes(ROLE_IDS.KNIGHT)) {
            assignedRole = 'Knight';
        } else if (userRoles.includes(ROLE_IDS.SQUIRE)) {
            assignedRole = 'Squire';
        } else if (userRoles.includes(ROLE_IDS.APPLICANT)) {
            assignedRole = 'Applicant';
        }

        return {
            assignedRole,
            isGrandmaster: userRoles.includes(ROLE_IDS.GRANDMASTER),
            isOfficer: userRoles.includes(ROLE_IDS.OFFICER)
        };
    } catch (err) {
        console.error("Error checking Discord roles:", err);
        return { assignedRole: 'Squire', isOfficer: false, isGrandmaster: false };
    }
}

async function syncUserToDatabaseRoster(session, assignedRole) {
    const userMeta = session.user.user_metadata;
    const discordId = userMeta.provider_id || session.user.identities?.[0]?.id || userMeta.sub;
    const discordName = userMeta.full_name || userMeta.name || userMeta.email || "Squire";

    const { data: existingMember } = await supabaseClient
        .from('guild_members')
        .select('*')
        .eq('discord_id', discordId)
        .single();

    if (!existingMember) {
        const { data: newMember } = await supabaseClient.from('guild_members').insert([{
            discord_id: discordId,
            username: discordName,
            in_game_name: discordName,
            character_class: 'Paladin',
            character_level: 1,
            role: assignedRole,
            focus: 'PvE Dungeons'
        }]).select().single();

        currentUserProfile = newMember;
        if (typeof fetchRosterFromSupabase === 'function') await fetchRosterFromSupabase();
    } else {
        if (existingMember.role !== assignedRole) {
            await supabaseClient.from('guild_members')
                .update({ role: assignedRole })
                .eq('discord_id', discordId);
            existingMember.role = assignedRole;
        }
        currentUserProfile = existingMember;
    }

    populateProfileForm();
}

function populateProfileForm() {
    if (!currentUserProfile) return;
    const nameEl = document.getElementById('profile-char-name');
    const classEl = document.getElementById('profile-class');
    const levelEl = document.getElementById('profile-level');
    const focusEl = document.getElementById('profile-focus');
    const roleEl = document.getElementById('profile-role');

    if (nameEl) nameEl.value = currentUserProfile.in_game_name || '';
    if (classEl) classEl.value = currentUserProfile.character_class || 'Paladin';
    if (levelEl) levelEl.value = currentUserProfile.character_level || 1;
    if (focusEl) focusEl.value = currentUserProfile.focus || 'PvE Dungeons';
    if (roleEl) roleEl.value = currentUserProfile.role || 'Squire';
}

async function saveUserProfile() {
    if (!currentUserProfile) return;

    const charName = document.getElementById('profile-char-name').value.trim();
    const charClass = document.getElementById('profile-class').value;
    const charLevel = parseInt(document.getElementById('profile-level').value) || 1;
    const focus = document.getElementById('profile-focus').value;

    if (!charName) {
        showNotification("Character name cannot be blank.", "error");
        return;
    }

    const { error } = await supabaseClient
        .from('guild_members')
        .update({
            in_game_name: charName,
            character_class: charClass,
            character_level: charLevel,
            focus: focus
        })
        .eq('id', currentUserProfile.id);

    if (error) {
        showNotification("Error updating profile: " + error.message, "error");
    } else {
        showNotification("Profile updated successfully!");
        currentUserProfile.in_game_name = charName;
        currentUserProfile.character_class = charClass;
        currentUserProfile.character_level = charLevel;
        currentUserProfile.focus = focus;
        if (typeof fetchRosterFromSupabase === 'function') await fetchRosterFromSupabase();
    }
}

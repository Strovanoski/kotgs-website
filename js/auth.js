// Authentication & Discord OAuth Sync
async function loginWithDiscord() {
    await supabaseClient.auth.signInWithOAuth({
        provider: 'discord',
        options: {
            redirectTo: 'https://strovanoski.github.io/kotgs-website/',
            scopes: 'identify email guilds.members.read'
        }
    });
}

async function logout() {
    await supabaseClient.auth.signOut();
    currentUserProfile = null;
    showNotification("Signed out successfully.");
}

async function updateAuthUI(session) {
    const loggedOutHeader = document.getElementById('auth-header-logged-out');
    const loggedInHeader = document.getElementById('auth-header-logged-in');
    const userNameSpan = document.getElementById('header-user-name');
    const profileNavBtn = document.getElementById('nav-profile');
    const mobileProfileBtn = document.getElementById('mobile-nav-profile');
    const officerNavBtn = document.getElementById('nav-officer');
    const mobileOfficerBtn = document.getElementById('mobile-nav-officer');

    if (session) {
        if (loggedOutHeader) loggedOutHeader.classList.add('hidden');
        if (loggedInHeader) loggedInHeader.classList.remove('hidden');
        if (profileNavBtn) profileNavBtn.classList.remove('hidden');
        if (mobileProfileBtn) mobileProfileBtn.classList.remove('hidden');

        const roleData = await checkDiscordRoles(session);
        const isOfficer = roleData.isGuildLeader || roleData.isOfficer;
        
        const assignedRole = roleData.isGuildLeader ? 'Grandmaster' : (roleData.isOfficer ? 'Knight-Commander' : 'Squire');

        if (userNameSpan) userNameSpan.textContent = session.user.user_metadata.full_name || session.user.email;

        await syncUserToDatabaseRoster(session, assignedRole);

        if (isOfficer) {
            showNotification("Welcome Officer! Command Center unlocked.", "success");
            if (officerNavBtn) officerNavBtn.classList.remove('hidden');
            if (mobileOfficerBtn) mobileOfficerBtn.classList.remove('hidden');
            fetchApplicationsFromSupabase();
        } else {
            if (officerNavBtn) officerNavBtn.classList.add('hidden');
            if (mobileOfficerBtn) mobileOfficerBtn.classList.add('hidden');
            document.getElementById('view-officer').classList.add('hidden');
        }
    } else {
        if (loggedOutHeader) loggedOutHeader.classList.remove('hidden');
        if (loggedInHeader) loggedInHeader.classList.add('hidden');
        if (profileNavBtn) profileNavBtn.classList.add('hidden');
        if (mobileProfileBtn) mobileProfileBtn.classList.add('hidden');
        if (officerNavBtn) officerNavBtn.classList.add('hidden');
        if (mobileOfficerBtn) mobileOfficerBtn.classList.add('hidden');
        document.getElementById('view-officer').classList.add('hidden');
        document.getElementById('view-profile').classList.add('hidden');
    }
}

async function checkDiscordRoles(session) {
    const providerToken = session.provider_token;
    if (!providerToken || !DISCORD_GUILD_ID) return { isGuildLeader: false, isOfficer: false };

    try {
        const response = await fetch(`https://discord.com/api/v10/users/@me/guilds/${DISCORD_GUILD_ID}/member`, {
            headers: { Authorization: `Bearer ${providerToken}` }
        });

        if (!response.ok) return { isGuildLeader: false, isOfficer: false };

        const memberData = await response.json();
        const userRoles = memberData.roles || [];

        return {
            isGuildLeader: userRoles.includes(GUILD_LEADER_ROLE_ID),
            isOfficer: userRoles.includes(OFFICER_ROLE_ID)
        };
    } catch (err) {
        console.error("Error checking Discord roles:", err);
        return { isGuildLeader: false, isOfficer: false };
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
        await fetchRosterFromSupabase();
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
    document.getElementById('profile-char-name').value = currentUserProfile.in_game_name || '';
    document.getElementById('profile-class').value = currentUserProfile.character_class || 'Paladin';
    document.getElementById('profile-level').value = currentUserProfile.character_level || 1;
    document.getElementById('profile-focus').value = currentUserProfile.focus || 'PvE Dungeons';
    document.getElementById('profile-role').value = currentUserProfile.role || 'Squire';
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
        await fetchRosterFromSupabase();
    }
}

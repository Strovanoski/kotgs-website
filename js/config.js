// Supabase Credentials
const SUPABASE_URL = "https://zzotvstvmnlmfrulxhvl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__o4vTB20JE2br9c_F3p8rQ_ez98q06n";

// Dedicated Discord Webhooks
const DISCORD_APPLICATIONS_WEBHOOK_URL = "https://discord.com/api/webhooks/1531232336920711239/Wt-LiJ64wHumDL34ntEL0IEe2PqV5mBVYeN6GLZIvrDrbyi7kd3zEU8zdi7lRY_J6IGS";
const DISCORD_NEWS_WEBHOOK_URL = "https://discord.com/api/webhooks/1531349501951082547/Yp7kx2fAvxEYjyrJgK4QUnfeLK49mWePMaehd5re0EqThmHT4jbnhLfGc8aGyh75TObs";
const DISCORD_EVENTS_WEBHOOK_URL = "https://discord.com/api/webhooks/1531349718570106964/oy_R8LS4ynFyYJ2uWhncN66IUWBbs-AOuDHry9cjR7W32PCGk4BGOjzyQavb-ZXlbCMA";

// Discord Server & Role IDs
const DISCORD_GUILD_ID = "1527962374366040084";
const GUILD_LEADER_ROLE_ID = "1531247534104907919";
const OFFICER_ROLE_ID = "1531248101573136474";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MM_CLASSES = [
    "Bard", "Beastmaster", "Cleric", "Druid", "Elementalist", "Enchanter",
    "Fighter", "Inquisitor", "Magician", "Monk", "Necromancer", "Paladin",
    "Ranger", "Rogue", "Shadow Knight", "Shaman", "Spellblade", "Wizard"
];

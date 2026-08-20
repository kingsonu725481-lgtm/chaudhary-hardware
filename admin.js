// ===============================
// CHAUDHARY HARDWARE ADMIN LOGIN
// ===============================

// ⚠️ इन दोनों को बाद में अपने Supabase Project की जानकारी से बदलना है
const SUPABASE_URL = "https://vaeuvwahddudgpuivxuh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Xw2pfPmdubwhMfGhCdLRPA_S8daMuWa";

let supabaseClient;

// Supabase library load करना
const script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
script.onload = () => {
    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );
};
document.head.appendChild(script);


// ===============================
// LOGIN
// ===============================

async function login() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    if (!email || !password) {
        message.textContent = "Email aur password dono bharo.";
        return;
    }

    if (!supabaseClient) {
        message.textContent = "System load ho raha hai, 2 second wait karo.";
        return;
    }

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {
        message.textContent = "Login failed: " + error.message;
        return;
    }

    // Login successful
    localStorage.setItem("adminLoggedIn", "true");

    window.location.href = "admin-dashboard.html";
}
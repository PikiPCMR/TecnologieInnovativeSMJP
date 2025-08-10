import { supabase } from './collegamentoDb.js';

const userId = localStorage.getItem('user');
const currentYear = new Date().getFullYear();
const startOfYear = `${currentYear}-01-01`;
const user = JSON.parse(localStorage.getItem('user'))?.id;

function openDashboardGestore() {
    window.location.href = "../html/internal_dashboard.html";
}
window.openDashboardGestore = openDashboardGestore;


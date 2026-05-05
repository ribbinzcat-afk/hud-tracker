// อัปเดตบรรทัด import ด้านบนสุด เพื่อดึง eventSource และ event_types มาใช้
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource, event_types } from "../../../../script.js";

const extensionName = "hud-tracker";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: false
};

function injectHUD() {
    if (!extension_settings[extensionName].enabled) return;

    // หาข้อความของ AI ทั้งหมด (is_user="false") ที่ยังไม่มี HUD
    $('.mes[is_user="false"] .mes_text').each(function() {
        if ($(this).find('.hud-tracker-container').length === 0) {
            // เปลี่ยนจาก append เป็น prepend เพื่อให้ไปอยู่ด้านบนสุด
            // และเปลี่ยน margin-top เป็น margin-bottom เพื่อเว้นระยะจากข้อความด้านล่าง
            $(this).prepend(`
                <div class="hud-tracker-container" style="border: 1px solid #888; padding: 10px; margin-bottom: 10px; border-radius: 5px; background: rgba(0,0,0,0.1);">
                    <b>HUD Tracker</b>
                    <p>✅ HUD injection is working at the top!</p>
                </div>
            `);
        }
    });
}

async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};

    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    $("#hud_tracker_enabled").prop("checked", extension_settings[extensionName].enabled);
}

function onCheckboxChange(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].enabled = value;
    saveSettingsDebounced();
    console.log(`[${extensionName}] Setting saved:`, value);

    // เพิ่มส่วนนี้: อัปเดต HUD ทันทีเมื่อเปิด/ปิด
    if (value) {
        injectHUD();
    } else {
        $('.hud-tracker-container').remove();
    }
}

function onButtonClick() {
    const isEnabled = extension_settings[extensionName].enabled;
    toastr.info(
        `Extension is ${isEnabled ? "enabled" : "disabled"}`,
        "HUD Tracker"
    );
    console.log(`[${extensionName}] Button clicked`);
}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        $("#hud_tracker_enabled").on("input", onCheckboxChange);
        $("#hud_tracker_test_button").on("click", onButtonClick);

        loadSettings();

        // เพิ่มส่วนนี้: ดักจับ Event ต่างๆ ของแชทเพื่อแทรก HUD
        eventSource.on(event_types.CHAT_CHANGED, injectHUD);
        eventSource.on(event_types.MESSAGE_RECEIVED, injectHUD);
        eventSource.on(event_types.MESSAGE_SWIPED, injectHUD);
        eventSource.on(event_types.MESSAGE_UPDATED, injectHUD); // เพิ่มอันนี้
        eventSource.on(event_types.GENERATION_STOPPED, injectHUD); // เพิ่มอันนี้

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});

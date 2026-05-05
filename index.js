import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "hud-tracker";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: false
};

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
}

// เพิ่มฟังก์ชันนี้ไว้ด้านบน (ก่อนถึง jQuery(async () => { ... }))
function onButtonClick() {
    const isEnabled = extension_settings[extensionName].enabled;
    toastr.info(
        `Extension is ${isEnabled ? "enabled" : "disabled"}`,
        "HUD Tracker"
    );
    console.log(`[${extensionName}] Button clicked`);
}

// และในส่วนของ jQuery(async () => { ... }) ให้เพิ่มบรรทัดนี้ต่อท้าย $("#hud_tracker_enabled").on("input", onCheckboxChange);
$("#hud_tracker_test_button").on("click", onButtonClick);

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        // Bind checkbox event
        $("#hud_tracker_enabled").on("input", onCheckboxChange);

        // Load saved settings
        loadSettings();

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});

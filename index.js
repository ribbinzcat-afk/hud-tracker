// อัปเดตบรรทัด import ด้านบนสุด เพื่อดึง eventSource และ event_types มาใช้
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource, event_types } from "../../../../script.js";

const extensionName = "hud-tracker";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// 1. อัปเดตโครงสร้าง defaultSettings ใหม่
const defaultSettings = {
    enabled: false,
    currentPreset: "Default",
    presets: {
        "Default": {
            headerTemplate: "HUD Tracker",
            contentTemplate: "Custom status goes here..."
        }
    }
};

// 5. อัปเดต injectHUD ให้ดึงข้อมูลจาก Preset ปัจจุบัน
function injectHUD() {
    if (!extension_settings[extensionName].enabled) return;

    const current = extension_settings[extensionName].currentPreset;
    const preset = extension_settings[extensionName].presets[current];
    const headerText = preset.headerTemplate || "HUD Tracker";
    const contentText = (preset.contentTemplate || "").replace(/\n/g, '<br>');

    $('.mes[is_user="false"] .mes_block').each(function() {
        if ($(this).find('.hud-tracker-container').length === 0) {
            $(this).find('.mes_text').before(`
                <div class="hud-tracker-container">
                    <div class="hud-tracker-header">
                        <span class="hud-tracker-header-text">${headerText}</span>
                        <i class="fa-solid fa-chevron-down hud-tracker-icon collapsed"></i>
                    </div>
                    <div class="hud-tracker-content collapsed">
                        ${contentText}
                    </div>
                </div>
            `);
        }
    });
}

// 4. อัปเดต onTemplateChange ให้บันทึกลง Preset ปัจจุบัน
function onTemplateChange() {
    const current = extension_settings[extensionName].currentPreset;
    extension_settings[extensionName].presets[current].headerTemplate = $("#hud_tracker_header_template").val();
    extension_settings[extensionName].presets[current].contentTemplate = $("#hud_tracker_content_template").val();
    saveSettingsDebounced();
    updateActiveHUDs();
}

function updateActiveHUDs() {
    const current = extension_settings[extensionName].currentPreset;
    const preset = extension_settings[extensionName].presets[current];
    const headerText = preset.headerTemplate || "HUD Tracker";
    const contentText = (preset.contentTemplate || "").replace(/\n/g, '<br>');

    $('.hud-tracker-container').each(function() {
        $(this).find('.hud-tracker-header-text').text(headerText);
        $(this).find('.hud-tracker-content').html(contentText);
    });
}

// 2. อัปเดต loadSettings เพื่อรองรับโครงสร้างใหม่
async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};

    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    // แปลงข้อมูลเก่า (ถ้ามี) ให้เข้ากับระบบ Preset
    if (!extension_settings[extensionName].presets) {
        extension_settings[extensionName].presets = {
            "Default": {
                headerTemplate: extension_settings[extensionName].headerTemplate || "HUD Tracker",
                contentTemplate: extension_settings[extensionName].contentTemplate || "Custom status goes here..."
            }
        };
        extension_settings[extensionName].currentPreset = "Default";
    }

    $("#hud_tracker_enabled").prop("checked", extension_settings[extensionName].enabled);

    updatePresetDropdown();
    loadCurrentPresetToUI();
}

// 3. ฟังก์ชันใหม่สำหรับจัดการ Preset
function updatePresetDropdown() {
    const select = $("#hud_tracker_preset_select");
    select.empty();
    for (const presetName in extension_settings[extensionName].presets) {
        select.append(`<option value="${presetName}">${presetName}</option>`);
    }
    select.val(extension_settings[extensionName].currentPreset);
}

function loadCurrentPresetToUI() {
    const current = extension_settings[extensionName].currentPreset;
    const preset = extension_settings[extensionName].presets[current];
    $("#hud_tracker_header_template").val(preset.headerTemplate);
    $("#hud_tracker_content_template").val(preset.contentTemplate);
}

function onPresetChange() {
    extension_settings[extensionName].currentPreset = $("#hud_tracker_preset_select").val();
    saveSettingsDebounced();
    loadCurrentPresetToUI();
    updateActiveHUDs(); // อัปเดตหน้าจอ
}

function onSaveNewPreset() {
    const newName = $("#hud_tracker_new_preset_name").val().trim();
    if (!newName) return;
    if (extension_settings[extensionName].presets[newName]) {
        toastr.warning("Preset name already exists!");
        return;
    }

    // บันทึกค่าปัจจุบันลง Preset ใหม่
    extension_settings[extensionName].presets[newName] = {
        headerTemplate: $("#hud_tracker_header_template").val(),
        contentTemplate: $("#hud_tracker_content_template").val()
    };
    extension_settings[extensionName].currentPreset = newName;
    saveSettingsDebounced();

    $("#hud_tracker_new_preset_name").val("");
    updatePresetDropdown();
    toastr.success(`Preset '${newName}' saved!`);
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

// เพิ่มฟังก์ชันนี้เพื่อหน่วงเวลารอให้หน้าจออัปเดตเสร็จก่อน
function triggerInjectHUD() {
    setTimeout(injectHUD, 100);
}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        $("#hud_tracker_enabled").on("input", onCheckboxChange);
        $("#hud_tracker_test_button").on("click", onButtonClick);
        $("#hud_tracker_header_template").on("input", onTemplateChange);
        $("#hud_tracker_content_template").on("input", onTemplateChange);

        // เพิ่มส่วนนี้: ดักจับการคลิกที่ Header เพื่อพับ/กาง HUD
        $(document).on('click', '.hud-tracker-header', function() {
            const container = $(this).closest('.hud-tracker-container');
            const content = container.find('.hud-tracker-content');
            const icon = container.find('.hud-tracker-icon');

            content.toggleClass('collapsed');
            icon.toggleClass('collapsed');
        });

        loadSettings();

        // เปลี่ยนไปใช้ triggerInjectHUD แทน injectHUD ตรงๆ
        eventSource.on(event_types.CHAT_CHANGED, triggerInjectHUD);
        eventSource.on(event_types.MESSAGE_RECEIVED, triggerInjectHUD);
        eventSource.on(event_types.MESSAGE_SWIPED, triggerInjectHUD);
        eventSource.on(event_types.MESSAGE_UPDATED, triggerInjectHUD);
        eventSource.on(event_types.GENERATION_STOPPED, triggerInjectHUD);

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});

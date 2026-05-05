// อัปเดตบรรทัด import ด้านบนสุด เพื่อดึง eventSource และ event_types มาใช้
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource, event_types } from "../../../../script.js";

const extensionName = "hud-tracker";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// 1. อัปเดต defaultSettings ให้มี promptTemplate
const defaultSettings = {
    enabled: false,
    currentPreset: "Default",
    presets: {
        "Default": {
            headerTemplate: "HUD Tracker",
            contentTemplate: "Custom status goes here...",
            promptTemplate: "" // เพิ่มอันนี้
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

// 5. อัปเดตฟังก์ชัน onTemplateChange
function onTemplateChange() {
    const current = extension_settings[extensionName].currentPreset;
    extension_settings[extensionName].presets[current].headerTemplate = $("#hud_tracker_header_template").val();
    extension_settings[extensionName].presets[current].contentTemplate = $("#hud_tracker_content_template").val();
    extension_settings[extensionName].presets[current].promptTemplate = $("#hud_tracker_prompt_template").val(); // เพิ่มอันนี้
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

// 2. อัปเดตฟังก์ชัน loadSettings เพื่อป้องกัน error จาก Preset เก่า
async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};

    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    if (!extension_settings[extensionName].presets) {
        extension_settings[extensionName].presets = {
            "Default": {
                headerTemplate: extension_settings[extensionName].headerTemplate || "HUD Tracker",
                contentTemplate: extension_settings[extensionName].contentTemplate || "Custom status goes here...",
                promptTemplate: ""
            }
        };
        extension_settings[extensionName].currentPreset = "Default";
    } else {
        // อัปเดต Preset เก่าที่เคยสร้างไว้ให้มีช่อง promptTemplate
        for (const key in extension_settings[extensionName].presets) {
            if (extension_settings[extensionName].presets[key].promptTemplate === undefined) {
                extension_settings[extensionName].presets[key].promptTemplate = "";
            }
        }
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

// 3. อัปเดตฟังก์ชัน loadCurrentPresetToUI
function loadCurrentPresetToUI() {
    const current = extension_settings[extensionName].currentPreset;
    const preset = extension_settings[extensionName].presets[current];
    $("#hud_tracker_header_template").val(preset.headerTemplate);
    $("#hud_tracker_content_template").val(preset.contentTemplate);
    $("#hud_tracker_prompt_template").val(preset.promptTemplate || ""); // เพิ่มอันนี้
}

function onPresetChange() {
    extension_settings[extensionName].currentPreset = $("#hud_tracker_preset_select").val();
    saveSettingsDebounced();
    loadCurrentPresetToUI();
    updateActiveHUDs(); // อัปเดตหน้าจอ
}

// 4. อัปเดตฟังก์ชัน onSaveNewPreset
function onSaveNewPreset() {
    const newName = $("#hud_tracker_new_preset_name").val().trim();
    if (!newName) return;
    if (extension_settings[extensionName].presets[newName]) {
        toastr.warning("Preset name already exists!");
        return;
    }

    extension_settings[extensionName].presets[newName] = {
        headerTemplate: $("#hud_tracker_header_template").val(),
        contentTemplate: $("#hud_tracker_content_template").val(),
        promptTemplate: $("#hud_tracker_prompt_template").val() // เพิ่มอันนี้
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

// ฟังก์ชันลบ Preset
function onDeletePreset() {
    const current = extension_settings[extensionName].currentPreset;
    if (current === "Default") {
        toastr.warning("Cannot delete Default preset!");
        return;
    }
    if (confirm(`Are you sure you want to delete preset '${current}'?`)) {
        delete extension_settings[extensionName].presets[current];
        extension_settings[extensionName].currentPreset = "Default";
        saveSettingsDebounced();
        updatePresetDropdown();
        loadCurrentPresetToUI();
        updateActiveHUDs();
        toastr.success("Preset deleted!");
    }
}

// ฟังก์ชันส่งออก (Export) เป็นไฟล์ JSON
function onExportPreset() {
    const current = extension_settings[extensionName].currentPreset;
    const presetData = extension_settings[extensionName].presets[current];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(presetData, null, 2));

    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `hud_preset_${current}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// ฟังก์ชันนำเข้า (Import) จากไฟล์ JSON
function onImportPreset(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.headerTemplate !== undefined && importedData.contentTemplate !== undefined) {
                let newName = file.name.replace('.json', '');
                // ถ้าชื่อซ้ำ ให้เติมตัวเลขต่อท้าย
                if (extension_settings[extensionName].presets[newName]) {
                    newName = newName + "_" + Math.floor(Date.now() / 1000);
                }

                extension_settings[extensionName].presets[newName] = importedData;
                extension_settings[extensionName].currentPreset = newName;
                saveSettingsDebounced();
                updatePresetDropdown();
                loadCurrentPresetToUI();
                updateActiveHUDs();
                toastr.success(`Preset imported as '${newName}'`);
            } else {
                toastr.error("Invalid preset file format.");
            }
        } catch (err) {
            toastr.error("Failed to parse JSON file.");
        }
        // ล้างค่า input file เพื่อให้ import ไฟล์เดิมซ้ำได้
        $("#hud_tracker_import_file").val("");
    };
    reader.readAsText(file);
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
        $("#hud_tracker_prompt_template").on("input", onTemplateChange); // เพิ่มอันนี้
        $("#hud_tracker_preset_select").on("change", onPresetChange);
        $("#hud_tracker_save_preset").on("click", onSaveNewPreset);
        // เพิ่ม Event สำหรับปุ่มใหม่ 3 ปุ่ม
        $("#hud_tracker_delete_preset").on("click", onDeletePreset);
        $("#hud_tracker_export_preset").on("click", onExportPreset);
        $("#hud_tracker_import_preset_btn").on("click", () => $("#hud_tracker_import_file").click());
        $("#hud_tracker_import_file").on("change", onImportPreset);

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

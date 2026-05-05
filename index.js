// อัปเดตบรรทัด import ด้านบนสุด เพื่อดึง eventSource และ event_types มาใช้
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource, event_types } from "../../../../script.js";

const extensionName = "hud-tracker";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: false,
    headerTemplate: "HUD Tracker",
    contentTemplate: "Custom status goes here..."
};


// 2. อัปเดตฟังก์ชัน injectHUD เพื่อใช้ข้อความจากการตั้งค่า
function injectHUD() {
    if (!extension_settings[extensionName].enabled) return;

    // ดึงข้อความมาใช้ (แปลงการขึ้นบรรทัดใหม่ใน textarea ให้เป็น <br> ใน HTML)
    const headerText = extension_settings[extensionName].headerTemplate || "HUD Tracker";
    const contentText = (extension_settings[extensionName].contentTemplate || "").replace(/\n/g, '<br>');

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

// 3. เพิ่มฟังก์ชันสำหรับบันทึก Template
function onTemplateChange() {
    extension_settings[extensionName].headerTemplate = $("#hud_tracker_header_template").val();
    extension_settings[extensionName].contentTemplate = $("#hud_tracker_content_template").val();
    saveSettingsDebounced();
    console.log(`[${extensionName}] Templates saved`);

    // อัปเดต HUD ที่แสดงอยู่บนหน้าจอทันที
    $('.hud-tracker-container').each(function() {
        $(this).find('.hud-tracker-header-text').text(extension_settings[extensionName].headerTemplate);
        $(this).find('.hud-tracker-content').html(extension_settings[extensionName].contentTemplate.replace(/\n/g, '<br>'));
    });
}

// 4. อัปเดตฟังก์ชัน loadSettings เพื่อโหลดข้อมูลลงในช่อง
async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};

    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    $("#hud_tracker_enabled").prop("checked", extension_settings[extensionName].enabled);
    $("#hud_tracker_header_template").val(extension_settings[extensionName].headerTemplate);
    $("#hud_tracker_content_template").val(extension_settings[extensionName].contentTemplate);
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

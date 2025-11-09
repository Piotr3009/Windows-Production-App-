/**
 * calculations.js
 * Sash Window Calculations Engine – ETAP 1 (2x2 configuration)
 * Wszystkie wartości odwzorowują zależności z arkusza "Sash Windows - 10.xlsx".
 */

export const CONSTANTS = Object.freeze({
    // Frame ⇄ Sash deductions
    SASH_WIDTH_DEDUCTION: 178,
    TOP_SASH_HEIGHT_DEDUCTION: 62.5,
    BOTTOM_SASH_HEIGHT_DEDUCTION: 29.5,

    // Frame component deductions
    JAMB_HEIGHT_DEDUCTION: 106,
    EXTERNAL_HEAD_LINER_DEDUCTION: 204,
    INTERNAL_HEAD_LINER_DEDUCTION: 170,

    // Horn allowances
    TOP_STILE_HORN_ALLOWANCE: 70,

    // Glazing deductions
    GLASS_WIDTH_DEDUCTION: 114,
    GLASS_WIDTH_ADD_BACK: 24,
    GLASS_TOP_HEIGHT_DEDUCTION: 100,
    GLASS_BOTTOM_HEIGHT_DEDUCTION: 133,
    GLASS_HEIGHT_ADD_BACK: 24,

    // Timber sections (mm)
    FRAME_SECTION: '69 × 57',
    SILL_SECTION: '95 × 57',
    SASH_SECTION: '57 × 57',
    HEAD_LINER_SECTION: '17 × 102',
    JAMB_LINER_SECTION: '17 × 85',
    GLAZING_BAR_WIDTH: 18,

    // Waste factors
    FRAME_WASTE_FACTOR: 1.15,
    SASH_WASTE_FACTOR: 1.15,
    COUNTERBALANCE_WASTE_FACTOR: 1.10,

    // Miscellaneous
    VAT_RATE: 0.2
});

/**
 * Główna funkcja obliczeniowa.
 * @param {number} frameWidth
 * @param {number} frameHeight
 * @param {string} configuration (tylko '2x2')
 * @param {object} options dodatkowe (paintColor, glazingType)
 * @returns {object}
 */
export function calculateWindow(frameWidth, frameHeight, configuration = '2x2', options = {}) {
    validateInputs(frameWidth, frameHeight, configuration);

    const sashWidth = frameWidth - CONSTANTS.SASH_WIDTH_DEDUCTION;
    const topSashHeight = frameHeight / 2 - CONSTANTS.TOP_SASH_HEIGHT_DEDUCTION;
    const bottomSashHeight = frameHeight / 2 - CONSTANTS.BOTTOM_SASH_HEIGHT_DEDUCTION;

    const frameComponents = calculateFrameComponents(frameWidth, frameHeight);
    const sashComponents = calculateSashComponents(sashWidth, topSashHeight, bottomSashHeight);
    const glazing = calculateGlazing(sashWidth, topSashHeight, bottomSashHeight, configuration, options.glazingType);
    const precutList = buildPrecutList(frameComponents, sashComponents);
    const cutList = buildCutList(frameComponents, sashComponents);
    const shoppingList = buildShoppingList(frameComponents, sashComponents, glazing, options);

    return {
        frame: {
            width: frameWidth,
            height: frameHeight
        },
        sashes: {
            top: {
                width: sashWidth,
                height: topSashHeight,
                heightWithHorn: topSashHeight + CONSTANTS.TOP_STILE_HORN_ALLOWANCE
            },
            bottom: {
                width: sashWidth,
                height: bottomSashHeight
            }
        },
        components: {
            frame: frameComponents,
            sash: sashComponents
        },
        glazing,
        precutList,
        cutList,
        shoppingList,
        options: {
            paintColor: options.paintColor || 'RAL 9010 White',
            glazingType: options.glazingType || '4mm Clear'
        }
    };
}

function validateInputs(frameWidth, frameHeight, configuration) {
    if (configuration !== '2x2') {
        throw new Error(`Configuration ${configuration} nie jest jeszcze dostępna w ETAP 1.`);
    }
    if (Number.isNaN(frameWidth) || Number.isNaN(frameHeight)) {
        throw new Error('Frame width/height must be numeric values.');
    }
    if (frameWidth < 400 || frameWidth > 3000) {
        throw new Error('Frame width must be between 400 and 3000 mm.');
    }
    if (frameHeight < 600 || frameHeight > 3000) {
        throw new Error('Frame height must be between 600 and 3000 mm.');
    }
}

function calculateFrameComponents(frameWidth, frameHeight) {
    const jambLength = frameHeight - CONSTANTS.JAMB_HEIGHT_DEDUCTION;
    const headLength = frameWidth;
    const sillLength = frameWidth;
    const extHeadLiner = frameWidth - CONSTANTS.EXTERNAL_HEAD_LINER_DEDUCTION;
    const intHeadLiner = frameWidth - CONSTANTS.INTERNAL_HEAD_LINER_DEDUCTION;
    const extJambLiner = frameHeight;
    const intJambLiner = frameHeight;

    return {
        head: { element: 'Head', width: 69, length: headLength, quantity: 1, section: CONSTANTS.FRAME_SECTION },
        jambs: { element: 'Jamb', width: 69, length: jambLength, quantity: 2, section: CONSTANTS.FRAME_SECTION },
        sill: { element: 'Sill', width: 95, length: sillLength, quantity: 1, section: CONSTANTS.SILL_SECTION },
        externalHeadLiner: { element: 'External head liner', width: 17, length: extHeadLiner, quantity: 1, section: CONSTANTS.HEAD_LINER_SECTION },
        internalHeadLiner: { element: 'Internal head liner', width: 17, length: intHeadLiner, quantity: 1, section: CONSTANTS.HEAD_LINER_SECTION },
        externalJambLiner: { element: 'External jamb liner', width: 17, length: extJambLiner, quantity: 2, section: CONSTANTS.JAMB_LINER_SECTION },
        internalJambLiner: { element: 'Internal jamb liner', width: 17, length: intJambLiner, quantity: 2, section: CONSTANTS.JAMB_LINER_SECTION }
    };
}

function calculateSashComponents(sashWidth, topSashHeight, bottomSashHeight) {
    const topHeightWithHorn = topSashHeight + CONSTANTS.TOP_STILE_HORN_ALLOWANCE;

    return {
        top: {
            stiles: { element: 'Top sash stiles', width: 57, length: topHeightWithHorn, quantity: 2, section: CONSTANTS.SASH_SECTION },
            topRail: { element: 'Top rail', width: 57, length: sashWidth, quantity: 1, section: CONSTANTS.SASH_SECTION },
            meetingRail: { element: 'Top meeting rail', width: 57, length: sashWidth, quantity: 1, section: CONSTANTS.SASH_SECTION }
        },
        bottom: {
            stiles: { element: 'Bottom sash stiles', width: 57, length: bottomSashHeight, quantity: 2, section: CONSTANTS.SASH_SECTION },
            bottomRail: { element: 'Bottom rail', width: 57, length: sashWidth, quantity: 1, section: CONSTANTS.SASH_SECTION },
            meetingRail: { element: 'Bottom meeting rail', width: 57, length: sashWidth, quantity: 1, section: CONSTANTS.SASH_SECTION }
        },
        glazingBars: calculateGlazingBars(sashWidth, topSashHeight, bottomSashHeight)
    };
}

function calculateGlazingBars(sashWidth, topSashHeight, bottomSashHeight) {
    const clearWidth = sashWidth - CONSTANTS.GLASS_WIDTH_DEDUCTION + CONSTANTS.GLASS_WIDTH_ADD_BACK;
    const topClearHeight = topSashHeight - CONSTANTS.GLASS_TOP_HEIGHT_DEDUCTION + CONSTANTS.GLASS_HEIGHT_ADD_BACK;
    const bottomClearHeight = bottomSashHeight - CONSTANTS.GLASS_BOTTOM_HEIGHT_DEDUCTION + CONSTANTS.GLASS_HEIGHT_ADD_BACK;

    const halfWidth = (clearWidth - CONSTANTS.GLAZING_BAR_WIDTH) / 2;

    return {
        vertical: {
            element: 'Vertical glazing bar',
            width: CONSTANTS.GLAZING_BAR_WIDTH,
            lengthTop: topClearHeight,
            lengthBottom: bottomClearHeight,
            quantity: 2
        },
        horizontal: {
            element: 'Horizontal glazing bar',
            width: CONSTANTS.GLAZING_BAR_WIDTH,
            length: halfWidth,
            quantity: 4
        }
    };
}

function calculateGlazing(sashWidth, topSashHeight, bottomSashHeight, configuration, glazingType = '4mm Clear') {
    const clearWidth = sashWidth - CONSTANTS.GLASS_WIDTH_DEDUCTION + CONSTANTS.GLASS_WIDTH_ADD_BACK;
    const topClearHeight = topSashHeight - CONSTANTS.GLASS_TOP_HEIGHT_DEDUCTION + CONSTANTS.GLASS_HEIGHT_ADD_BACK;
    const bottomClearHeight = bottomSashHeight - CONSTANTS.GLASS_BOTTOM_HEIGHT_DEDUCTION + CONSTANTS.GLASS_HEIGHT_ADD_BACK;

    const paneWidth = (clearWidth - CONSTANTS.GLAZING_BAR_WIDTH) / 2;
    const topPaneHeight = (topClearHeight - CONSTANTS.GLAZING_BAR_WIDTH) / 2;
    const bottomPaneHeight = (bottomClearHeight - CONSTANTS.GLAZING_BAR_WIDTH) / 2;

    return {
        configuration,
        glazingType,
        panes: [
            { id: 'T1', position: 'Top left', width: paneWidth, height: topPaneHeight, toughened: false },
            { id: 'T2', position: 'Top right', width: paneWidth, height: topPaneHeight, toughened: false },
            { id: 'B1', position: 'Bottom left', width: paneWidth, height: bottomPaneHeight, toughened: false },
            { id: 'B2', position: 'Bottom right', width: paneWidth, height: bottomPaneHeight, toughened: false }
        ]
    };
}

function buildPrecutList(frameComponents, sashComponents) {
    const items = [];
    items.push(frameComponents.head, frameComponents.sill);
    items.push({ ...frameComponents.jambs });
    items.push(frameComponents.externalHeadLiner, frameComponents.internalHeadLiner);
    items.push({ ...frameComponents.externalJambLiner });
    items.push({ ...frameComponents.internalJambLiner });

    const { top, bottom } = sashComponents;
    items.push(top.topRail, top.stiles, top.meetingRail);
    items.push(bottom.bottomRail, bottom.stiles, bottom.meetingRail);

    return items;
}

function buildCutList(frameComponents, sashComponents) {
    const list = [];
    list.push({ element: 'Head', specification: `${frameComponents.head.length} mm`, quantity: 1, notes: frameComponents.head.section });
    list.push({ element: 'Jamb', specification: `${frameComponents.jambs.length} mm`, quantity: 2, notes: frameComponents.jambs.section });
    list.push({ element: 'Sill', specification: `${frameComponents.sill.length} mm`, quantity: 1, notes: frameComponents.sill.section });
    list.push({ element: 'Head liner ext', specification: `${frameComponents.externalHeadLiner.length} mm`, quantity: 1, notes: frameComponents.externalHeadLiner.section });
    list.push({ element: 'Head liner int', specification: `${frameComponents.internalHeadLiner.length} mm`, quantity: 1, notes: frameComponents.internalHeadLiner.section });
    list.push({ element: 'Jamb liner ext', specification: `${frameComponents.externalJambLiner.length} mm`, quantity: 2, notes: frameComponents.externalJambLiner.section });
    list.push({ element: 'Jamb liner int', specification: `${frameComponents.internalJambLiner.length} mm`, quantity: 2, notes: frameComponents.internalJambLiner.section });

    const { top, bottom } = sashComponents;
    list.push({ element: 'Top rail', specification: `${top.topRail.length} mm`, quantity: 1, notes: top.topRail.section });
    list.push({ element: 'Top sash stiles', specification: `${top.stiles.length} mm`, quantity: 2, notes: `${top.stiles.section} (horned)` });
    list.push({ element: 'Top meeting rail', specification: `${top.meetingRail.length} mm`, quantity: 1, notes: top.meetingRail.section });
    list.push({ element: 'Bottom rail', specification: `${bottom.bottomRail.length} mm`, quantity: 1, notes: bottom.bottomRail.section });
    list.push({ element: 'Bottom sash stiles', specification: `${bottom.stiles.length} mm`, quantity: 2, notes: bottom.stiles.section });
    list.push({ element: 'Bottom meeting rail', specification: `${bottom.meetingRail.length} mm`, quantity: 1, notes: bottom.meetingRail.section });

    return list;
}

function buildShoppingList(frameComponents, sashComponents, glazing, options) {
    const frameLinear = (frameComponents.head.length + frameComponents.sill.length + frameComponents.jambs.length * 2) * CONSTANTS.FRAME_WASTE_FACTOR / 1000;
    const linerLinear = (frameComponents.externalHeadLiner.length + frameComponents.internalHeadLiner.length + (frameComponents.externalJambLiner.length + frameComponents.internalJambLiner.length) * 2) * CONSTANTS.FRAME_WASTE_FACTOR / 1000;

    const sashLinear = (sashComponents.top.topRail.length + sashComponents.top.meetingRail.length + sashComponents.bottom.meetingRail.length + sashComponents.bottom.bottomRail.length + sashComponents.top.stiles.length * 2 + sashComponents.bottom.stiles.length * 2) * CONSTANTS.SASH_WASTE_FACTOR / 1000;

    const counterbalanceLinear = sashComponents.bottom.bottomRail.length * CONSTANTS.COUNTERBALANCE_WASTE_FACTOR / 1000;

    const glazingItems = glazing.panes.map(pane => ({
        material: `Glass pane ${pane.id}`,
        specification: `${pane.width.toFixed(1)} × ${pane.height.toFixed(1)} mm ${glazing.glazingType}`,
        quantity: 1,
        unit: 'ea'
    }));

    return {
        timber: [
            { material: 'Frame timber', specification: frameComponents.head.section, quantity: roundTo(frameLinear, 2), unit: 'm' },
            { material: 'Liners', specification: `${frameComponents.externalHeadLiner.section} & ${frameComponents.externalJambLiner.section}`, quantity: roundTo(linerLinear, 2), unit: 'm' },
            { material: 'Sash timber', specification: sashComponents.top.topRail.section, quantity: roundTo(sashLinear, 2), unit: 'm' },
            { material: 'Counterbalance groove', specification: 'Weights & cords allowance', quantity: roundTo(counterbalanceLinear, 2), unit: 'm' }
        ],
        glass: glazingItems,
        hardware: [
            { material: 'Trickle vent', specification: 'Concealed', quantity: 1, unit: 'set' },
            { material: 'Fasteners & locks', specification: 'Polished brass', quantity: 1, unit: 'set' }
        ],
        finishing: [
            { material: 'Paint', specification: options.paintColor || 'RAL 9010 White', quantity: 1, unit: 'system' }
        ]
    };
}

function roundTo(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

/**
 * calculations.js
 * Sash Window Calculations Engine – ETAP 1 (2x2 configuration)
 * Wszystkie wartości odwzorowują zależności z arkusza "Sash Windows - 10.xlsx".
 */

export const CONSTANTS = Object.freeze({
    // Frame ⇄ Sash deductions
    SASH_WIDTH_DEDUCTION: 178,
    SASH_HEIGHT_DEDUCTION: 106,

    // Frame component deductions
    JAMB_HEIGHT_DEDUCTION: 106,
    HEAD_WIDTH_DEDUCTION: 138,
    SILL_WIDTH_DEDUCTION: 138,
    EXTERNAL_HEAD_LINER_DEDUCTION: 204,
    INTERNAL_HEAD_LINER_DEDUCTION: 170,

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
    const sashHeight = frameHeight - CONSTANTS.SASH_HEIGHT_DEDUCTION;

    const frameComponents = calculateFrameComponents(frameWidth, frameHeight);
    const sashComponents = calculateSashComponents(sashWidth, sashHeight);
    const glazing = calculateGlazing(sashWidth, sashHeight, configuration, options.glazingType);
    const precutList = buildPrecutList(frameComponents, sashComponents);
    const cutList = buildCutList(frameComponents, sashComponents);
    const shoppingList = buildShoppingList(frameComponents, sashComponents, glazing, options);

    return {
        frame: {
            width: frameWidth,
            height: frameHeight
        },
        sash: {
            width: sashWidth,
            height: sashHeight
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

/**
 * Weryfikuje poprawność parametrów wejściowych.
 * @param {number} frameWidth
 * @param {number} frameHeight
 * @param {string} configuration
 */
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

/**
 * Oblicza długości elementów ramy na bazie wymiarów zewnętrznych.
 * @param {number} frameWidth
 * @param {number} frameHeight
 * @returns {object}
 */
function calculateFrameComponents(frameWidth, frameHeight) {
    const jambLength = frameHeight - CONSTANTS.JAMB_HEIGHT_DEDUCTION;
    const headLength = frameWidth - CONSTANTS.HEAD_WIDTH_DEDUCTION;
    const sillLength = frameWidth - CONSTANTS.SILL_WIDTH_DEDUCTION;
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

/**
 * Buduje zestaw elementów skrzydła (sash) dla konfiguracji 2x2.
 * @param {number} sashWidth
 * @param {number} sashHeight
 * @returns {object}
 */
function calculateSashComponents(sashWidth, sashHeight) {
    return {
        stiles: { element: 'Sash stiles', width: 57, length: sashHeight, quantity: 2, section: CONSTANTS.SASH_SECTION },
        topRail: { element: 'Top rail', width: 57, length: sashWidth, quantity: 1, section: CONSTANTS.SASH_SECTION },
        meetingRail: { element: 'Meeting rail', width: 57, length: sashWidth, quantity: 1, section: CONSTANTS.SASH_SECTION },
        bottomRail: { element: 'Bottom rail', width: 57, length: sashWidth, quantity: 1, section: CONSTANTS.SASH_SECTION },
        glazingBars: calculateGlazingBars(sashWidth, sashHeight)
    };
}

/**
 * Oblicza listwy szprosów dla układu 2x2.
 * @param {number} sashWidth
 * @param {number} sashHeight
 * @returns {object}
 */
function calculateGlazingBars(sashWidth, sashHeight) {
    const clearWidth = sashWidth - CONSTANTS.GLASS_WIDTH_DEDUCTION + CONSTANTS.GLASS_WIDTH_ADD_BACK;
    const clearHeight = sashHeight - (CONSTANTS.GLASS_TOP_HEIGHT_DEDUCTION + CONSTANTS.GLASS_BOTTOM_HEIGHT_DEDUCTION) + CONSTANTS.GLASS_HEIGHT_ADD_BACK;
    const halfWidth = (clearWidth - CONSTANTS.GLAZING_BAR_WIDTH) / 2;
    const halfHeight = (clearHeight - CONSTANTS.GLAZING_BAR_WIDTH) / 2;

    return {
        vertical: {
            element: 'Vertical glazing bar',
            width: CONSTANTS.GLAZING_BAR_WIDTH,
            length: clearHeight,
            quantity: 2
        },
        horizontal: {
            element: 'Horizontal glazing bar',
            width: CONSTANTS.GLAZING_BAR_WIDTH,
            length: clearWidth,
            quantity: 2
        },
        paneWidth: halfWidth,
        paneHeight: halfHeight
    };
}

/**
 * Wylicza widoczne światło szkła oraz wymiary pojedynczych tafli.
 * @param {number} sashWidth
 * @param {number} sashHeight
 * @param {string} configuration
 * @param {string} glazingType
 * @returns {object}
 */
function calculateGlazing(sashWidth, sashHeight, configuration, glazingType = '4mm Clear') {
    const clearWidth = sashWidth - CONSTANTS.GLASS_WIDTH_DEDUCTION + CONSTANTS.GLASS_WIDTH_ADD_BACK;
    const clearHeight = sashHeight - (CONSTANTS.GLASS_TOP_HEIGHT_DEDUCTION + CONSTANTS.GLASS_BOTTOM_HEIGHT_DEDUCTION) + CONSTANTS.GLASS_HEIGHT_ADD_BACK;
    const paneWidth = (clearWidth - CONSTANTS.GLAZING_BAR_WIDTH) / 2;
    const paneHeight = (clearHeight - CONSTANTS.GLAZING_BAR_WIDTH) / 2;

    return {
        configuration,
        glazingType,
        clearWidth,
        clearHeight,
        panes: [
            { id: 'T1', position: 'Top left', width: paneWidth, height: paneHeight, toughened: false },
            { id: 'T2', position: 'Top right', width: paneWidth, height: paneHeight, toughened: false },
            { id: 'B1', position: 'Bottom left', width: paneWidth, height: paneHeight, toughened: false },
            { id: 'B2', position: 'Bottom right', width: paneWidth, height: paneHeight, toughened: false }
        ]
    };
}

/**
 * Generuje listę elementów do przygotowania (pre-cut list).
 * @param {object} frameComponents
 * @param {object} sashComponents
 * @returns {Array<object>}
 */
function buildPrecutList(frameComponents, sashComponents) {
    const items = [];
    items.push(frameComponents.head, frameComponents.sill);
    items.push({ ...frameComponents.jambs });
    items.push(frameComponents.externalHeadLiner, frameComponents.internalHeadLiner);
    items.push({ ...frameComponents.externalJambLiner });
    items.push({ ...frameComponents.internalJambLiner });
    items.push(sashComponents.topRail, sashComponents.bottomRail, sashComponents.meetingRail);
    items.push({ ...sashComponents.stiles });
    items.push({ element: 'Vertical glazing bar', width: sashComponents.glazingBars.vertical.width, length: sashComponents.glazingBars.vertical.length, quantity: sashComponents.glazingBars.vertical.quantity, section: CONSTANTS.SASH_SECTION });
    items.push({ element: 'Horizontal glazing bar', width: sashComponents.glazingBars.horizontal.width, length: sashComponents.glazingBars.horizontal.length, quantity: sashComponents.glazingBars.horizontal.quantity, section: CONSTANTS.SASH_SECTION });

    return items;
}

/**
 * Generuje listę cięć dla stolarni.
 * @param {object} frameComponents
 * @param {object} sashComponents
 * @returns {Array<object>}
 */
function buildCutList(frameComponents, sashComponents) {
    const list = [];
    list.push({ element: 'Head', specification: `${frameComponents.head.length} mm`, quantity: 1, notes: frameComponents.head.section });
    list.push({ element: 'Jamb', specification: `${frameComponents.jambs.length} mm`, quantity: 2, notes: frameComponents.jambs.section });
    list.push({ element: 'Sill', specification: `${frameComponents.sill.length} mm`, quantity: 1, notes: frameComponents.sill.section });
    list.push({ element: 'Head liner ext', specification: `${frameComponents.externalHeadLiner.length} mm`, quantity: 1, notes: frameComponents.externalHeadLiner.section });
    list.push({ element: 'Head liner int', specification: `${frameComponents.internalHeadLiner.length} mm`, quantity: 1, notes: frameComponents.internalHeadLiner.section });
    list.push({ element: 'Jamb liner ext', specification: `${frameComponents.externalJambLiner.length} mm`, quantity: 2, notes: frameComponents.externalJambLiner.section });
    list.push({ element: 'Jamb liner int', specification: `${frameComponents.internalJambLiner.length} mm`, quantity: 2, notes: frameComponents.internalJambLiner.section });

    list.push({ element: 'Top rail', specification: `${sashComponents.topRail.length} mm`, quantity: 1, notes: sashComponents.topRail.section });
    list.push({ element: 'Meeting rail', specification: `${sashComponents.meetingRail.length} mm`, quantity: 1, notes: sashComponents.meetingRail.section });
    list.push({ element: 'Bottom rail', specification: `${sashComponents.bottomRail.length} mm`, quantity: 1, notes: sashComponents.bottomRail.section });
    list.push({ element: 'Sash stiles', specification: `${sashComponents.stiles.length} mm`, quantity: sashComponents.stiles.quantity, notes: sashComponents.stiles.section });
    list.push({ element: 'Vertical glazing bars', specification: `${sashComponents.glazingBars.vertical.length.toFixed(1)} mm`, quantity: sashComponents.glazingBars.vertical.quantity, notes: `${CONSTANTS.GLAZING_BAR_WIDTH} mm width` });
    list.push({ element: 'Horizontal glazing bars', specification: `${sashComponents.glazingBars.horizontal.length.toFixed(1)} mm`, quantity: sashComponents.glazingBars.horizontal.quantity, notes: `${CONSTANTS.GLAZING_BAR_WIDTH} mm width` });

    return list;
}

/**
 * Szacuje ilości materiałów na potrzeby zakupów.
 * @param {object} frameComponents
 * @param {object} sashComponents
 * @param {object} glazing
 * @param {object} options
 * @returns {object}
 */
function buildShoppingList(frameComponents, sashComponents, glazing, options) {
    const frameLinear = (frameComponents.head.length + frameComponents.sill.length + frameComponents.jambs.length * 2) * CONSTANTS.FRAME_WASTE_FACTOR / 1000;
    const linerLinear = (frameComponents.externalHeadLiner.length + frameComponents.internalHeadLiner.length + (frameComponents.externalJambLiner.length + frameComponents.internalJambLiner.length) * 2) * CONSTANTS.FRAME_WASTE_FACTOR / 1000;

    const sashLinear = (sashComponents.topRail.length + sashComponents.meetingRail.length + sashComponents.bottomRail.length + sashComponents.stiles.length * sashComponents.stiles.quantity) * CONSTANTS.SASH_WASTE_FACTOR / 1000;

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
            { material: 'Sash timber', specification: sashComponents.topRail.section, quantity: roundTo(sashLinear, 2), unit: 'm' }
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

/**
 * Zaokrągla wartość do podanej liczby miejsc po przecinku.
 * @param {number} value
 * @param {number} decimals
 * @returns {number}
 */
function roundTo(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

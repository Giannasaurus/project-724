const {
    AlignmentType,
    BorderStyle,
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType
} = require('docx')

const NO_BORDERS = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
}

const SEX_LABELS = { 0: 'Male', 1: 'Female' }
const CIVIL_STATUS_LABELS = {
    0: 'Single',
    1: 'Married',
    2: 'Widowed',
    3: 'Divorced',
    4: 'Annulled',
    5: 'Legally Separated'
}

const REASON_LABELS = {
    medical: 'Medical/Financial Assistance',
    financial: 'Medical/Financial Assistance',
    food: 'Food Assistance',
    scholarship: 'Scholarship',
    education: 'Educational Assistance',
    funeral: 'Funeral/Burial Assistance',
    soloParentPwd: 'Solo Parent/PWD Assistance',
    residency: 'Proof of Residency'
}

function getResidentValue(resident, field) {
    const pascalField = `${field[0].toUpperCase()}${field.slice(1)}`
    return resident?.[field] ?? resident?.[pascalField] ?? ''
}

function getResidentFullName(resident) {
    const firstName = getResidentValue(resident, 'firstName')
    const middleName = getResidentValue(resident, 'middleName')
    const lastName = getResidentValue(resident, 'lastName')
    const suffix = getResidentValue(resident, 'suffix')
    const middleInitial = middleName ? `${middleName[0]}.` : ''

    return `${lastName}, ${firstName} ${middleInitial} ${suffix}`.replace(/\s+/g, ' ').trim()
}

function getCivilStatus(resident) {
    const value = getResidentValue(resident, 'civilStatus')
    return CIVIL_STATUS_LABELS[value] ?? String(value || '')
}

function getPronoun(resident) {
    const sex = getResidentValue(resident, 'sex')
    return SEX_LABELS[sex] === 'Male' ? 'he' : 'she'
}

function getCurrentDateParts() {
    const date = new Date()
    const day = date.getDate()
    const suffix = day % 10 === 1 && day !== 11
        ? 'st'
        : day % 10 === 2 && day !== 12
            ? 'nd'
            : day % 10 === 3 && day !== 13
                ? 'rd'
                : 'th'

    return {
        day: `${day}${suffix}`,
        month: date.toLocaleString('en-US', { month: 'long' }),
        year: String(date.getFullYear())
    }
}

function text(text, options = {}) {
    return new TextRun({
        text,
        font: options.font ?? 'Arial',
        size: options.size ?? 22,
        bold: options.bold,
        underline: options.underline ? {} : undefined,
        color: options.color
    })
}

function paragraph(children, options = {}) {
    return new Paragraph({
        alignment: options.alignment,
        spacing: {
            before: options.before ?? 0,
            after: options.after ?? 120,
            line: options.line ?? 310
        },
        indent: options.indent,
        children
    })
}

function rule() {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 18, type: WidthType.PERCENTAGE },
                        shading: { fill: 'F0C33C' },
                        borders: NO_BORDERS,
                        children: [paragraph([text(' ')], { after: 0, line: 80 })]
                    }),
                    new TableCell({
                        width: { size: 10, type: WidthType.PERCENTAGE },
                        shading: { fill: '1E9DCC' },
                        borders: NO_BORDERS,
                        children: [paragraph([text(' ')], { after: 0, line: 80 })]
                    }),
                    new TableCell({
                        width: { size: 72, type: WidthType.PERCENTAGE },
                        borders: {
                            ...NO_BORDERS,
                            top: { style: BorderStyle.SINGLE, size: 8, color: '1E9DCC' },
                            bottom: { style: BorderStyle.SINGLE, size: 3, color: '74BDD6' }
                        },
                        children: [paragraph([text(' ')], { after: 0, line: 80 })]
                    })
                ]
            })
        ]
    })
}

function option(label, selected) {
    return paragraph([
        text(selected ? '  X  ' : '_____ ', { bold: selected, underline: true }),
        text(label)
    ], { after: 60, line: 240 })
}

function optionCell(label, selected) {
    return new TableCell({
        borders: NO_BORDERS,
        children: [option(label, selected)]
    })
}

function getSelectedReasons(reasonType) {
    const selected = new Set()
    const label = REASON_LABELS[reasonType]
    if (label) selected.add(label)
    return selected
}

function signatureCell(lines) {
    return new TableCell({
        borders: NO_BORDERS,
        children: lines
    })
}

function createIndigencyDoc(context = {}) {
    const resident = context.resident ?? {}
    const selectedReasons = getSelectedReasons(context.reasonType)
    const isOther = context.reasonType === 'other'
    const date = getCurrentDateParts()
    const fullName = getResidentFullName(resident)
    const address = getResidentValue(resident, 'address')

    return new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 650,
                            right: 720,
                            bottom: 650,
                            left: 720
                        }
                    }
                },
                children: [
                    rule(),
                    paragraph([
                        text('BARANGAY INDIGENCY', {
                            font: 'Times New Roman',
                            size: 56,
                            bold: true,
                            underline: true
                        })
                    ], { alignment: AlignmentType.CENTER, before: 620, after: 420 }),
                    paragraph([text('TO WHOM IT MAY CONCERN:', { bold: true })], { after: 160 }),
                    paragraph([
                        text('This is to certify that '),
                        text(fullName, { bold: true, underline: true }),
                        text(' of legal age, '),
                        text(`${getCivilStatus(resident)} Filipino`, { underline: true }),
                        text(' is a bonafide resident of '),
                        text(address, { bold: true, underline: true }),
                        text(` Barangay 724 Zone 79, District V, Manila and that ${getPronoun(resident)} belongs to a low-income family and does not have the financial capacity to support personal and medical needs without assistance.`)
                    ], { after: 220 }),
                    paragraph([
                        text('This Indigent certification issued upon his/her request for:')
                    ], { alignment: AlignmentType.CENTER, after: 160 }),
                    new Table({
                        width: { size: 86, type: WidthType.PERCENTAGE },
                        alignment: AlignmentType.CENTER,
                        rows: [
                            new TableRow({
                                children: [
                                    optionCell('Medical/Financial Assistance', selectedReasons.has('Medical/Financial Assistance')),
                                    optionCell('Educational Assistance', selectedReasons.has('Educational Assistance'))
                                ]
                            }),
                            new TableRow({
                                children: [
                                    optionCell('Food Assistance', selectedReasons.has('Food Assistance')),
                                    optionCell('Funeral/Burial Assistance', selectedReasons.has('Funeral/Burial Assistance'))
                                ]
                            }),
                            new TableRow({
                                children: [
                                    optionCell('Scholarship', selectedReasons.has('Scholarship')),
                                    optionCell('Solo Parent/PWD Assistance', selectedReasons.has('Solo Parent/PWD Assistance'))
                                ]
                            }),
                            new TableRow({
                                children: [
                                    optionCell('Proof of Residency', selectedReasons.has('Proof of Residency')),
                                    optionCell('', false)
                                ]
                            })
                        ]
                    }),
                    paragraph([text('Others pls Specify:', { bold: true })], { before: 180, after: 70, indent: { left: 900 } }),
                    paragraph([
                        text(isOther ? '  X  ' : '_____ ', { bold: isOther, underline: true }),
                        text('  '),
                        text(isOther ? context.otherReason || ' ' : '                                                    ', { underline: true })
                    ], { after: 130, indent: { left: 900 } }),
                    paragraph([
                        text(`Issued and signed this ${date.day} day of ${date.month} ${date.year}.`)
                    ], { after: 520, indent: { left: 700 } }),
                    new Table({
                        width: { size: 90, type: WidthType.PERCENTAGE },
                        alignment: AlignmentType.CENTER,
                        rows: [
                            new TableRow({
                                children: [
                                    signatureCell([
                                        paragraph([text('____________________________')], { alignment: AlignmentType.CENTER, after: 40 }),
                                        paragraph([text('Signature over printed name')], { alignment: AlignmentType.CENTER, after: 0 })
                                    ]),
                                    signatureCell([
                                        paragraph([text('____________________________')], { alignment: AlignmentType.CENTER, after: 40 }),
                                        paragraph([text('ROLANDO V. NAVARRO', { bold: true })], { alignment: AlignmentType.CENTER, after: 0 }),
                                        paragraph([text('Punong Barangay')], { alignment: AlignmentType.CENTER, after: 0 })
                                    ])
                                ]
                            })
                        ]
                    }),
                    paragraph([text(' ')], { after: 560 }),
                    rule(),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    signatureCell([paragraph([text('barangay724zone79@gmail.com', { bold: true, size: 18 })], { alignment: AlignmentType.CENTER, after: 0 })]),
                                    signatureCell([paragraph([text('2207 Singalong Street, Malate Manila', { bold: true, size: 18 })], { alignment: AlignmentType.CENTER, after: 0 })]),
                                    signatureCell([paragraph([text('Barangay 724 Zone 79', { bold: true, size: 18 })], { alignment: AlignmentType.CENTER, after: 0 })])
                                ]
                            })
                        ]
                    })
                ]
            }
        ]
    })
}

function stripHtml(html) {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '\n')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

async function createWordDocumentBuffer({ html, context }) {
    if (context?.documentType === '2') {
        return Packer.toBuffer(createIndigencyDoc(context))
    }

    const document = new Document({
        sections: [
            {
                children: stripHtml(html).split(/\n+/).map(line => paragraph([text(line)]))
            }
        ]
    })

    return Packer.toBuffer(document)
}

module.exports = {
    createWordDocumentBuffer
}

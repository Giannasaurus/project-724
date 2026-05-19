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
    medical: 'Medical Assistance',
    financial: 'Financial Assistance',
    food: 'Food Assistance',
    scholarship: 'Scholarship',
    education: 'Educational Assistance',
    funeral: 'Funeral/Burial Assistance',
    soloParentPwd: 'Solo Parent/PWD Assistance',
    residency: 'Proof of Residency',
    orangeCard: 'Orange Card'
}

const DEFAULT_DOCUMENT_DEFAULTS = {
    barangayName: 'Barangay 724',
    barangayZone: 'Zone 79, District V',
    barangayAddress: '2207 Singalong Street, Malate Manila',
    chairName: 'ROLANDO V. NAVARRO',
    chairTitle: 'Punong Barangay',
    email: 'barangay724zone79@gmail.com',
    facebook: 'Barangay 724 Zone 79'
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

function getResidentAge(resident) {
    const explicitAge = getResidentValue(resident, 'age')
    if (explicitAge !== '' && explicitAge !== null && explicitAge !== undefined) return String(explicitAge)

    const birthDate = new Date(getResidentValue(resident, 'birthDate'))
    if (Number.isNaN(birthDate.getTime())) return ''

    const now = new Date()
    let age = now.getFullYear() - birthDate.getFullYear()
    const hadBirthdayThisYear = now.getMonth() > birthDate.getMonth()
        || (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate())

    if (!hadBirthdayThisYear) age -= 1

    return String(age)
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
    const optionLine = selected ? '___X___  ' : '_______  '

    return paragraph([
        text(optionLine, { bold: selected }),
        text(label)
    ], { after: 20, line: 190 })
}

function optionCell(label, selected) {
    return new TableCell({
        borders: NO_BORDERS,
        children: label
            ? [option(label, selected)]
            : [paragraph([text(' ')], { after: 0, line: 190 })]
    })
}

function getSelectedReason(reasonType) {
    const label = REASON_LABELS[reasonType]
    return label ?? ''
}

function signatureCell(lines) {
    return new TableCell({
        borders: NO_BORDERS,
        children: lines
    })
}

function createResidencyDoc(context = {}) {
    const resident = context.resident ?? {}
    const defaults = {
        ...DEFAULT_DOCUMENT_DEFAULTS,
        ...(context.documentDefaults ?? {})
    }
    const date = getCurrentDateParts()
    const fullName = getResidentFullName(resident)
    const address = getResidentValue(resident, 'address')
    const age = getResidentAge(resident) || '____'
    const barangay = `${defaults.barangayName} ${defaults.barangayZone}`.trim()

    return new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 360,
                            right: 720,
                            bottom: 500,
                            left: 720
                        }
                    }
                },
                children: [
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 18, type: WidthType.PERCENTAGE },
                                        shading: { fill: 'EEF6D5' },
                                        borders: NO_BORDERS,
                                        children: [
                                            paragraph([text('BARANGAY', { bold: true, size: 16, color: '172554' })], { alignment: AlignmentType.CENTER, after: 0, line: 180 }),
                                            paragraph([text('724', { bold: true, size: 22, color: '172554' })], { alignment: AlignmentType.CENTER, after: 0, line: 180 })
                                        ]
                                    }),
                                    new TableCell({
                                        width: { size: 82, type: WidthType.PERCENTAGE },
                                        shading: { fill: 'F7FBEF' },
                                        borders: NO_BORDERS,
                                        children: [
                                            paragraph([text('REPUBLIC OF THE PHILIPPINES', { bold: true, size: 18 })], { alignment: AlignmentType.CENTER, after: 0, line: 190 }),
                                            paragraph([text('CITY OF MANILA', { bold: true, size: 17 })], { alignment: AlignmentType.CENTER, after: 0, line: 190 }),
                                            paragraph([text('B A R A N G A Y', { bold: true, size: 25 })], { alignment: AlignmentType.CENTER, after: 0, line: 210 }),
                                            paragraph([text(barangay, { bold: true, size: 18 })], { alignment: AlignmentType.CENTER, after: 0, line: 190 }),
                                            paragraph([text(`OFFICE OF THE ${defaults.chairTitle.toUpperCase()}`, { bold: true, size: 23 })], { alignment: AlignmentType.CENTER, after: 0, line: 220 })
                                        ]
                                    })
                                ]
                            })
                        ]
                    }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        shading: { fill: '222222' },
                                        borders: NO_BORDERS,
                                        children: [paragraph([text(' ')], { after: 0, line: 60 })]
                                    })
                                ]
                            })
                        ]
                    }),
                    paragraph([
                        text('CERTIFICATE OF RESIDENCY', {
                            size: 36,
                            bold: true
                        })
                    ], { alignment: AlignmentType.CENTER, before: 230, after: 360, line: 280 }),
                    paragraph([text('To Whom It May Concern,', { bold: true })], { after: 190, indent: { left: 540 }, line: 240 }),
                    paragraph([
                        text('This is to certify that '),
                        text(fullName, { bold: true, underline: true }),
                        text(`, ${age} years old, Filipino citizen is a bonafide resident of `),
                        text(address, { bold: true, underline: true }),
                        text(`, ${barangay}, Manila.`)
                    ], { after: 310, indent: { left: 900, firstLine: 420 }, line: 280 }),
                    paragraph([
                        text('This is to certify further that the above-mentioned name is '),
                        text('living in this Barangay since', { bold: true }),
                        text(' ____________________ '),
                        text('up to present.', { bold: true })
                    ], { after: 300, indent: { left: 900, firstLine: 420 }, line: 280 }),
                    paragraph([
                        text('This certification is being issued upon the request of the above-mentioned name in connection for '),
                        text('whatever legal purposes it may serve.', { bold: true })
                    ], { after: 330, indent: { left: 900, firstLine: 420 }, line: 280 }),
                    paragraph([
                        text(`Given this ${date.day} day of ${date.month}, ${date.year}, at the Office of the Punong Barangay.`)
                    ], { after: 520, indent: { left: 900, firstLine: 420 }, line: 280 }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    signatureCell([paragraph([text(' ')], { after: 0 })]),
                                    signatureCell([
                                        paragraph([text('____________________________')], { alignment: AlignmentType.CENTER, after: 30 }),
                                        paragraph([text(defaults.chairTitle)], { alignment: AlignmentType.CENTER, after: 0 })
                                    ])
                                ]
                            })
                        ]
                    }),
                    paragraph([text('By this authority of the Punong Barangay:')], { before: 440, after: 300, indent: { left: 540 }, line: 240 }),
                    paragraph([text('____________________________')], { alignment: AlignmentType.CENTER, after: 30 }),
                    paragraph([text('Sangguniang Barangay Member')], { alignment: AlignmentType.CENTER, after: 0 })
                ]
            }
        ]
    })
}

function createIndigencyDoc(context = {}) {
    const resident = context.resident ?? {}
    const defaults = {
        ...DEFAULT_DOCUMENT_DEFAULTS,
        ...(context.documentDefaults ?? {})
    }
    const selectedReason = getSelectedReason(context.reasonType)
    const isOther = context.reasonType === 'other'
    const date = getCurrentDateParts()
    const fullName = getResidentFullName(resident)
    const address = getResidentValue(resident, 'address')
    const civilStatus = getCivilStatus(resident)
    const pronoun = getPronoun(resident)

    return new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 360,
                            right: 720,
                            bottom: 360,
                            left: 720
                        }
                    }
                },
                children: [
                    rule(),
                    paragraph([
                        text('BARANGAY INDIGENCY', {
                            font: 'Times New Roman',
                            size: 46,
                            bold: true,
                            underline: true
                        })
                    ], { alignment: AlignmentType.CENTER, before: 220, after: 180 }),
                    paragraph([text('TO WHOM IT MAY CONCERN:', { bold: true })], { after: 100, line: 260 }),
                    paragraph([
                        text('This is to certify that '),
                        text(fullName, { bold: true, underline: true }),
                        text(' of legal age, '),
                        text(`${civilStatus} Filipino`, { underline: true }),
                        text(' is a bonafide resident of '),
                        text(address, { bold: true, underline: true }),
                        text(` ${defaults.barangayName} ${defaults.barangayZone}, Manila and that ${pronoun} belongs to a low-income family and does not have the financial capacity to support personal and medical needs without assistance.`)
                    ], { after: 120, line: 260 }),
                    paragraph([
                        text('This Indigent certification issued upon his/her request for:')
                    ], { alignment: AlignmentType.CENTER, after: 80, line: 240 }),
                    new Table({
                        width: { size: 90, type: WidthType.PERCENTAGE },
                        alignment: AlignmentType.CENTER,
                        rows: [
                            new TableRow({
                                children: [
                                    optionCell('Medical Assistance', selectedReason === 'Medical Assistance'),
                                    optionCell('Financial Assistance', selectedReason === 'Financial Assistance')
                                ]
                            }),
                            new TableRow({
                                children: [
                                    optionCell('Food Assistance', selectedReason === 'Food Assistance'),
                                    optionCell('Scholarship', selectedReason === 'Scholarship')
                                ]
                            }),
                            new TableRow({
                                children: [
                                    optionCell('Educational Assistance', selectedReason === 'Educational Assistance'),
                                    optionCell('Funeral/Burial Assistance', selectedReason === 'Funeral/Burial Assistance')
                                ]
                            }),
                            new TableRow({
                                children: [
                                    optionCell('Orange Card', selectedReason === 'Orange Card'),
                                    optionCell('Solo Parent/PWD Assistance', selectedReason === 'Solo Parent/PWD Assistance')
                                ]
                            }),
                            new TableRow({
                                children: [
                                    optionCell('Proof of Residency', selectedReason === 'Proof of Residency'),
                                    optionCell('', false)
                                ]
                            })
                        ]
                    }),
                    paragraph([text('Others pls Specify:', { bold: true })], { before: 70, after: 30, indent: { left: 700 }, line: 220 }),
                    paragraph([
                        text(isOther ? '___X___  ' : '_______  ', { bold: isOther }),
                        text('  '),
                        text(isOther ? context.otherReason || ' ' : '                                                    ', { underline: true })
                    ], { after: 90, indent: { left: 700 }, line: 220 }),
                    paragraph([
                        text(`Issued and signed this ${date.day} day of ${date.month} ${date.year}.`)
                    ], { after: 260, indent: { left: 700 }, line: 240 }),
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
                                        paragraph([text(defaults.chairName, { bold: true })], { alignment: AlignmentType.CENTER, after: 0 }),
                                        paragraph([text(defaults.chairTitle)], { alignment: AlignmentType.CENTER, after: 0 })
                                    ])
                                ]
                            })
                        ]
                    }),
                    paragraph([text(' ')], { after: 130, line: 120 }),
                    rule(),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    signatureCell([paragraph([text(defaults.email, { bold: true, size: 18 })], { alignment: AlignmentType.CENTER, after: 0 })]),
                                    signatureCell([paragraph([text(defaults.barangayAddress, { bold: true, size: 18 })], { alignment: AlignmentType.CENTER, after: 0 })]),
                                    signatureCell([paragraph([text(defaults.facebook, { bold: true, size: 18 })], { alignment: AlignmentType.CENTER, after: 0 })])
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
        .replace(/<p[^>]*>\s*This\s+(?:indigent\s+)?certification\s+issued\s+upon[\s\S]*?request\s+for:\s*<\/p>\s*<div[^>]*class=["']section-request-type["'][\s\S]*?<\/div>\s*<br\s*\/?>?/gi, '')
        .replace(/<div[^>]*class=["']section-request-type["'][\s\S]*?<\/div>\s*<br\s*\/?>?/gi, '')
        .replace(/<[^>]+>/g, '\n')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

async function createWordDocumentBuffer({ html, context }) {
    if (context?.documentType === '1') {
        return Packer.toBuffer(createResidencyDoc(context))
    }

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

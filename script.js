 // Function to download enriched LIDO XML
 function downloadUpdatedXml(content, originalFileName) {
    const enrichedFileName = originalFileName.replace('.xml', '_enriched.xml');
    const blob = new Blob([content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = enrichedFileName;
    a.click();
    URL.revokeObjectURL(url);
}

// Convert LIDO to CSV functionality
document.getElementById('convertBtn').addEventListener('click', () => {
    const lidoFile = document.getElementById('lidoInput').files[0];
    const actorChecked = document.getElementById('actor').checked;
    const placeChecked = document.getElementById('place').checked;
    const subjectChecked = document.getElementById('subject').checked;

    if (!lidoFile) {
        alert('Please upload a LIDO XML file.');
        return;
    }

    if (!actorChecked && !placeChecked && !subjectChecked) {
        alert('Please select at least one field to extract.');
        return;
    }

    // Logic to handle LIDO to CSV extraction
    const reader = new FileReader();
    reader.onload = async function (e) {
        const xmlContent = e.target.result;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

        const rootElement = xmlDoc.documentElement.nodeName;
        if (rootElement !== 'lido:lidoWrap' && rootElement !== 'lido:lido') {
            alert('Invalid LIDO file. The root element must be lido:lidoWrap or lido:lido.');
            return;
        }

        const rows = [];
        if (actorChecked) {
            extractFields(xmlDoc, 'actor', rows);
        }
        if (placeChecked) {
            extractFields(xmlDoc, 'place', rows);
        }
        if (subjectChecked) {
            extractFields(xmlDoc, 'subjectConcept', rows);
        }

        const csvContent = generateCSV(rows);
        downloadCSV(csvContent, lidoFile.name); // Pass the original filename here
        document.getElementById('convertStatus').innerText = 'CSV file generated and downloaded!';
    };

    reader.readAsText(lidoFile);
});

// Function to extract specific fields from XML
function extractFields(xmlDoc, field, rows) {
    const namespace = "http://www.lido-schema.org";
    let elements;
    switch (field) {
        case 'actor':
            elements = xmlDoc.getElementsByTagNameNS(namespace, 'actor');
            break;
        case 'place':
            elements = xmlDoc.getElementsByTagNameNS(namespace, 'place');
            break;
        case 'subject':
            elements = xmlDoc.getElementsByTagNameNS(namespace, 'subjectConcept');
            break;
    }
    
    Array.from(elements).forEach(element => {
        const location = getXPath(element);
        const text = getTextContent(element, field, namespace);
        const idData = getIDData(element, field, namespace);
        const row = { location, text };
        

        // Dynamically add all ID, source, and type columns
        idData.forEach((idObj, index) => {
            row[`id_${index + 1}`] = idObj.id;
            row[`source_${index + 1}`] = idObj.source;
            row[`type_${index + 1}`] = idObj.type;
        });
        rows.push(row);
    });
}

// Function to generate full XPath of an element
function getXPath(element) {
let path = '';
while (element && element.nodeType === Node.ELEMENT_NODE) {
let index = 1;
let sibling = element.previousSibling;
while (sibling) {
    if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) {
        index++;
    }
    sibling = sibling.previousSibling;
}
const tagName = element.nodeName;
const pathIndex = (index > 1) ? `[${index}]` : '';
path = `/${tagName}${pathIndex}` + path;
element = element.parentNode;
}
return path;
}

// Function to get the text content of an element
function getTextContent(element, field, namespace) {
let text = '';
switch (field) {
case 'actor':
    text = element.getElementsByTagNameNS(namespace, 'appellationValue')[0]?.textContent || '';
    break;
case 'place':
    text = element.getElementsByTagNameNS(namespace, 'appellationValue')[0]?.textContent || '';
    break;
case 'subject':
    text = element.getElementsByTagNameNS(namespace, 'term')[0]?.textContent || '';
    break;
}
return text;
}


// Function to get multiple IDs, sources, and types
function getIDData(element, field, namespace) {
let idElements = [];
switch (field) {
case 'actor':
    idElements = Array.from(element.getElementsByTagNameNS(namespace, 'actorID'));
    break;
case 'place':
    idElements = Array.from(element.getElementsByTagNameNS(namespace, 'placeID'));
    break;
case 'subject':
    idElements = Array.from(element.getElementsByTagNameNS(namespace, 'conceptID'));
    break;
}

return idElements.map(idElement => ({
id: idElement.textContent || '',
source: idElement.getAttribute('lido:source') || '',
type: idElement.getAttribute('lido:type') || ''
}));
}

// Function to generate CSV from extracted rows
function generateCSV(rows) {
    const maxIDs = Math.max(...rows.map(row => Object.keys(row).filter(key => key.startsWith('id_')).length));

    const header = ['location', 'text'];
    for (let i = 1; i <= maxIDs; i++) {
        header.push(`id_${i}`, `source_${i}`, `type_${i}`);
    }

    const csvRows = rows.map(row => {
        return header.map(column => {
            const value = row[column] || '';
            return `"${value.replace(/"/g, '""')}"`; // Escape double quotes
        }).join(',');
    });
    
    return [header.join(','), ...csvRows].join('\n');
}

// Function to download CSV
function downloadCSV(csvContent, filename) {
    const csvFileName = filename.replace('.xml', '.csv');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = csvFileName;
    a.click();
    URL.revokeObjectURL(url);
}

// Function to get the full XPath of an element
function getXPath(element) {
    let path = '';
    while (element && element.nodeType === Node.ELEMENT_NODE) {
        let index = 1;
        let sibling = element.previousSibling;
        while (sibling) {
            if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) {
                index++;
            }
            sibling = sibling.previousSibling;
        }
        const tagName = element.nodeName;
        const position = `[${index}]`;
        path = '/' + tagName + position + path;
        element = element.parentNode;
    }
    return path;
}

// Function to get the text content of an element
function getTextContent(element, field, namespace) {
let tagName;
if (field === 'actor') {
tagName = 'appellationValue';
} else if (field === 'place') {
tagName = 'appellationValue';
} else if (field === 'subject') {
tagName = 'term';
}

const subElements = element.getElementsByTagNameNS(namespace, tagName);
console.log(element);
if (subElements.length > 0) {
return subElements[0].textContent.trim();
}
return '';
}



// CSV to LIDO XML enrichment functionality
document.getElementById('enrichBtn').addEventListener('click', () => {
    const xmlFile = document.getElementById('xmlInput').files[0];
    const csvFile = document.getElementById('csvInput').files[0];

    if (!xmlFile || !csvFile) {
        alert('Please upload both LIDO XML and CSV files.');
        return;
    }

    const readerXml = new FileReader();
    const readerCsv = new FileReader();

    readerXml.onload = async function (e) {
        const xmlContent = e.target.result;
        readerCsv.onload = function (e) {
            const csvContent = e.target.result;
            const enrichedXml = enrichLidoXmlWithCsv(xmlContent, csvContent);
            downloadUpdatedXml(enrichedXml, xmlFile.name);
            document.getElementById('enrichStatus').innerText = 'LIDO XML enriched and downloaded!';
        };

        readerCsv.readAsText(csvFile);
    };

    readerXml.readAsText(xmlFile);
});

// Function to enrich LIDO XML with CSV data
function enrichLidoXmlWithCsv(xmlContent, csvContent) {
const parser = new DOMParser();
const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

const rows = csvContent.split('\n').map(row => row.split(','));
const headers = rows[0]; // First row is the header
const dataRows = rows.slice(1); // Remaining rows are data

const namespace = 'http://www.lido-schema.org';

// Mapping the ID element names based on the field type (actor, place, subjectConcept)
const idTagMapping = {
'actor': 'lido:actorID',
'place': 'lido:placeID',
'subject': 'lido:conceptID'
};

dataRows.forEach(row => {
const location = row[0].replace('"', '');  // Remove double quotes if they exist
const fieldType = identifyFieldType(location);  // Identify field type: actor, place, or subject

// If no valid field type is found, log a message and skip this row
if (!fieldType) {
    console.warn(`Skipping row due to unrecognized field type for XPath: ${location}`);
    return; // Skip the row if field type is not recognized
}

const idTag = idTagMapping[fieldType];

const idValues = row.slice(2); // The ID, source, and type values start from column 2

const targetElement = getElementByXPath(xmlDoc, location);
if (targetElement) {
    const parentElement = targetElement.parentNode;

    for (let i = 0; i < idValues.length; i += 3) {
        const id = idValues[i];
        const source = idValues[i + 1];
        const type = idValues[i + 2];

        if (id && source && type) {
            const newIdElement = xmlDoc.createElementNS(namespace, idTag);
            newIdElement.textContent = id;
            if (source) newIdElement.setAttribute('lido:source', source);
            if (type) newIdElement.setAttribute('lido:type', type);

            parentElement.appendChild(newIdElement);
        }
    }
} else {
    console.error(`No target element found for XPath: ${location}`);
}
});

const serializer = new XMLSerializer();
return serializer.serializeToString(xmlDoc);
}

// Helper function to determine the type of field based on the XPath location
function identifyFieldType(location) {
if (location.includes('actor')) {
return 'actor';
} else if (location.includes('place')) {
return 'place';
} else if (location.includes('subjectConcept')) {
return 'subject';
} else {
return null;  // Return null if no match
}
}



// Namespace resolver for LIDO XML
function nsResolver(prefix) {
const ns = {
lido: "http://www.lido-schema.org"
};
return ns[prefix] || null;
}

// Function to find an element by its XPath with namespace support
function getElementByXPath(xmlDoc, xpath) {
const evaluator = new XPathEvaluator();

// Evaluate the XPath expression with the namespace resolver
console.log(xpath.replace('\"',''));
const result = evaluator.evaluate(xpath.replace('\"',''), xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

return result.singleNodeValue;
}
const cheerio = require('cheerio');

const PAGE_URL = 'https://www.pricecharting.com/console/one-piece-azure-sea%27s-seven';
const headers = {
    'User-Agent': 'Mozilla/5.0'
};
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchCardRows() {
    let response = await fetch(PAGE_URL, { headers });
    if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.statusText}`);
    }

    let $ = cheerio.load(await response.text());
    const cardRows = $('#games_table tbody tr').toArray();

    while ((form = $('form.js-next-page')).length) {
        const body = new URLSearchParams();
        form.find('input[type="hidden"]').each((_, input) => {
            body.append($(input).attr('name'), $(input).attr('value') ?? '');
        });
        await sleep(1000); // Wait 1 second before making the next request
        response = await fetch(PAGE_URL, { method: 'POST', headers, body });
        if (!response.ok) {
            throw new Error(`Failed to fetch page: ${response.statusText}`);
        }
        $ = cheerio.load(await response.text());
        const beforeCount = cardRows.length;
        cardRows.push(...$('#games_table tbody tr').toArray());
        if (cardRows.length === beforeCount) {
            break; // No new rows were added, exit the loop
        }
    }
    return cardRows;
}

async function parseCardRow(cardRow) {
    const $ = cheerio.load(cardRow);
    const cardTitle = $('td.title a').text().trim().split(' ');
    const cardPageUrl = $('td.image a').attr('href');
    const cardId = cardTitle.pop();
    const cardName = cardTitle.join(' ');

    if (!cardId.match(/^[A-Z]{2,}[0-9]{2}-[0-9]{3}$/)) {
        console.warn(`Invalid card ID format: ${cardId}`);
        return null;
    }
    return { cardId, cardName, cardPageUrl };
}

async function parseCardPrices(cardPageUrl) {
    const response = await fetch(cardPageUrl, { headers });
    if (!response.ok) {
        throw new Error(`Failed to fetch card page: ${response.statusText}`);
    }

    const $ = cheerio.load(await response.text());
    const priceRows = $('#full-prices table tr').toArray();
    if (priceRows == null || priceRows.length === 0) {
        console.warn(`No price rows found for card page: ${cardPageUrl}`);
        return { ungraded: null, psa10: null };
    }
    
    const prices = {};
    priceRows.forEach(row => {
        const cells = $(row).find('td').toArray();
        if (cells.length >= 2) {
            const condition = $(cells[0]).text().trim();
            const price = $(cells[1]).text().trim();
            if (condition === 'Ungraded') {
                prices.ungraded = parseFloat(price.replace(/[^0-9.-]+/g, '')) || null;
            } else if (condition === 'PSA 10') {
                prices.psa10 = parseFloat(price.replace(/[^0-9.-]+/g, '')) || null;
            }
        }
    })

    return prices;
}

async function scrapePrices() {
    const cardRows = await fetchCardRows();
    console.log(`Total card rows fetched: ${cardRows.length}`);
    const priceEntries = [];
    for (const cardRow of cardRows) {
        const cardData = await parseCardRow(cardRow);
        if (cardData === null) {
            continue;
        }
        await sleep(2000); // Wait 2 seconds before making the next request
        const prices = await parseCardPrices(cardData.cardPageUrl);
        priceEntries.push({
            card_id: cardData.cardId,
            card_name: cardData.cardName,
            prices: {
                ungraded: prices.ungraded,
                psa10: prices.psa10
            }
        });
    }
    console.log(`Total price entries scraped: ${priceEntries.length}`);
    return priceEntries;
}

module.exports = {
    scrapePrices
};
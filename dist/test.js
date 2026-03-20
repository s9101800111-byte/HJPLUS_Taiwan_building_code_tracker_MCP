"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scraper_js_1 = require("./scraper.js");
const search_js_1 = require("./search.js");
async function runTest() {
    console.log('Testing Scraper...');
    try {
        const data = await (0, scraper_js_1.fetchLawData)(true);
        console.log(`Law Name: ${data.lawName}`);
        console.log(`Articles Count: ${data.articles.length}`);
        console.log(`Last Updated: ${data.lastUpdated}`);
        if (data.articles.length > 0) {
            console.log('\nSample Article:');
            console.log(`Chapter: ${data.articles[0].chapter}`);
            console.log(`Number: ${data.articles[0].articleNum}`);
            console.log(`Content: ${data.articles[0].content.substring(0, 100)}...`);
        }
        console.log('\nTesting Search (Keyword: "活載重")...');
        const results = (0, search_js_1.searchLaw)(data.articles, '活載重', 3);
        console.log(`Found ${results.length} results.`);
        results.forEach(r => {
            console.log(`- [Score: ${r.score}] ${r.articleNum}: ${r.content.substring(0, 50)}...`);
        });
        console.log('\nTesting Search (Multiple Keywords: "地震力 基礎")...');
        const results2 = (0, search_js_1.searchLaw)(data.articles, '地震力 基礎', 3);
        console.log(`Found ${results2.length} results.`);
        results2.forEach(r => {
            console.log(`- [Score: ${r.score.toFixed(2)}] ${r.articleNum}: ${r.content.substring(0, 50)}...`);
        });
    }
    catch (error) {
        console.error('Test failed:', error);
    }
}
runTest();

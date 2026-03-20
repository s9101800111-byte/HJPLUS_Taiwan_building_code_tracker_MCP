"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchLawData = fetchLawData;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const MOJ_URL = 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0070115';
const CACHE_FILE = path_1.default.join(process.cwd(), 'data', 'law_cache.json');
async function fetchLawData(forceRefresh = false) {
    if (!forceRefresh) {
        try {
            const cacheExists = await promises_1.default.access(CACHE_FILE).then(() => true).catch(() => false);
            if (cacheExists) {
                const cacheContent = await promises_1.default.readFile(CACHE_FILE, 'utf-8');
                return JSON.parse(cacheContent);
            }
        }
        catch (error) {
            // If error or no cache, proceed to fetch
        }
    }
    const { data } = await axios_1.default.get(MOJ_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        responseType: 'text'
    });
    const $ = cheerio.load(data);
    // Try to get law name from multiple possible locations
    const lawName = $('#ctl00_cpHolder_lblLawName').text().trim() ||
        $('.text-con h1').text().trim() ||
        $('title').text().split('-')[0].trim();
    const articles = [];
    let currentChapter = '';
    const container = $('.law-reg-content');
    const children = container.children();
    children.each((_, el) => {
        const $el = $(el);
        if ($el.hasClass('row')) {
            // Exclude sr-only text from col-no
            const $colNo = $el.find('.col-no');
            $colNo.find('.sr-only').remove();
            const colNo = $colNo.text().trim();
            const colData = $el.find('.col-data').text().trim().replace(/\s+/g, ' ');
            if (colNo) {
                // Clean up article number
                const cleanArticleNum = colNo.replace(/\s+/g, '').trim();
                articles.push({
                    chapter: currentChapter,
                    articleNum: cleanArticleNum,
                    content: colData
                });
            }
            else if (colData && (colData.includes('第') && (colData.includes('章') || colData.includes('編') || colData.includes('節')))) {
                currentChapter = colData;
            }
        }
        else {
            // Non-row children might be chapter titles
            const text = $el.text().trim().replace(/\s+/g, ' ');
            if (text && text.length < 100 && (text.includes('第') && (text.includes('章') || text.includes('編') || text.includes('節')))) {
                currentChapter = text;
            }
        }
    });
    const lawData = {
        lawName,
        lastUpdated: new Date().toISOString(),
        articles
    };
    // Ensure data directory exists
    await promises_1.default.mkdir(path_1.default.dirname(CACHE_FILE), { recursive: true });
    await promises_1.default.writeFile(CACHE_FILE, JSON.stringify(lawData, null, 2), 'utf-8');
    return lawData;
}

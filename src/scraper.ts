import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { LawData, Article } from './types.js';

const MOJ_URL = 'https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0070115';
const CACHE_FILE = path.join(process.cwd(), 'data', 'law_cache.json');

export async function fetchLawData(forceRefresh = false): Promise<LawData> {
  if (!forceRefresh) {
    try {
      const cacheExists = await fs.access(CACHE_FILE).then(() => true).catch(() => false);
      if (cacheExists) {
        const cacheContent = await fs.readFile(CACHE_FILE, 'utf-8');
        return JSON.parse(cacheContent);
      }
    } catch (error) {
      // If error or no cache, proceed to fetch
    }
  }

  const { data } = await axios.get(MOJ_URL, {
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

  const articles: Article[] = [];
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
      } else if (colData && (colData.includes('第') && (colData.includes('章') || colData.includes('編') || colData.includes('節')))) {
        currentChapter = colData;
      }
    } else {
      // Non-row children might be chapter titles
      const text = $el.text().trim().replace(/\s+/g, ' ');
      if (text && text.length < 100 && (text.includes('第') && (text.includes('章') || text.includes('編') || text.includes('節')))) {
        currentChapter = text;
      }
    }
  });

  const lawData: LawData = {
    lawName,
    lastUpdated: new Date().toISOString(),
    articles
  };

  // Ensure data directory exists
  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify(lawData, null, 2), 'utf-8');

  return lawData;
}

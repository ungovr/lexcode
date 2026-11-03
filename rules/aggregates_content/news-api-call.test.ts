// lexcode-expect: 4
import axios from 'axios';
import NewsAPI from 'newsapi';

const newsapi = new NewsAPI(process.env.NEWSAPI_KEY as string);

// Headlines and snippets from other publishers, shown in the app's own feed.
export async function topStories(topic: string) {
  const res = await fetch(`https://newsapi.org/v2/top-headlines?category=${topic}&language=en`, {
    headers: { 'X-Api-Key': process.env.NEWSAPI_KEY as string },
  });
  const { articles } = await res.json();
  return articles.map((a: any) => ({ title: a.title, url: a.url, snippet: a.description, image: a.urlToImage }));
}

export async function guardian(q: string) {
  const { data } = await axios.get('https://content.guardianapis.com/search', { params: { q, 'api-key': process.env.GUARDIAN_KEY, 'show-fields': 'trailText,thumbnail' } });
  return data.response.results;
}

export async function viaClient() {
  const a = await newsapi.v2.topHeadlines({ country: 'us' });
  const b = await newsapi.v2.everything({ q: 'housing', sortBy: 'publishedAt' });
  return [...a.articles, ...b.articles];
}

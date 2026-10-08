import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getNews, getNewsArticle } from '../../api/newsApi';
import useNotification from '../../components/common/useNotification';

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) : '';
}

export default function NewsPage() {
  const { slug } = useParams();
  const { notify } = useNotification();
  const currentKey = slug ? `article:${slug}` : 'list';
  const [loaded, setLoaded] = useState(null);

  useEffect(() => {
    let active = true;
    const request = slug ? getNewsArticle(slug) : getNews({ per_page: 30 });
    request.then((response) => {
      if (!active) return;
      if (slug) {
        if (!response.data?.data) throw new Error('Data berita dari server tidak valid.');
        setLoaded({ key: currentKey, article: response.data.data, articles: [], message: '' });
      } else {
        if (!Array.isArray(response.data?.data)) throw new Error('Daftar berita dari server tidak valid.');
        setLoaded({ key: currentKey, article: null, articles: response.data.data, message: '' });
      }
    }).catch((error) => {
      console.error('Failed to load server news', error);
      if (active) {
        const message = slug
          ? 'Berita tidak dapat dibuka. Periksa koneksi lalu coba lagi.'
          : 'Berita gagal dimuat. Periksa koneksi lalu coba lagi.';
        notify(message, { title: 'Berita tidak tersedia', type: 'error' });
        setLoaded({
          key: currentKey,
          article: null,
          articles: [],
          message,
        });
      }
    });

    return () => {
      active = false;
    };
  }, [currentKey, notify, slug]);

  const isLoading = loaded?.key !== currentKey;
  const article = loaded?.key === currentKey ? loaded.article : null;
  const articles = loaded?.key === currentKey ? loaded.articles : [];
  const message = loaded?.key === currentKey ? loaded.message : '';

  return (
    <div className="container py-4 pb-5">
      <div className="page-heading mb-3">
        <span className="small text-primary fw-semibold text-uppercase">Informasi terbaru</span>
        <h3 className="fw-bold mb-1 mt-1">{article?.title || 'Berita CPNS'}</h3>
        {article ? <p className="text-muted small">{formatDate(article.published_at)}</p> : null}
      </div>
      {slug ? (
        <Link to="/news" className="btn btn-link p-0 mb-3 text-decoration-none">
          <i className="bi bi-arrow-left me-1" /> Kembali ke berita
        </Link>
      ) : null}
      {isLoading ? (
        <div className="card border-0 rounded-4 shadow-sm">
          <div className="card-body placeholder-glow">
            <span className="placeholder col-6 mb-3" />
            <span className="placeholder col-10" />
          </div>
        </div>
      ) : null}
      {!isLoading && article ? (
        <article className="card border-0 rounded-4 shadow-sm">
          {article.image ? (
            <img
              src={article.image}
              alt={article.title}
              className="news-cover"
              onError={(event) => { event.currentTarget.hidden = true; }}
            />
          ) : null}
          <div className="card-body p-4">
            {article.summary ? <p className="lead">{article.summary}</p> : null}
            <div className="news-content">{article.content}</div>
          </div>
        </article>
      ) : null}
      {!isLoading && !slug && articles.length ? (
        <div className="d-grid gap-3">
          {articles.map((item) => (
            <Link
              to={`/news/${encodeURIComponent(item.slug)}`}
              className="card border-0 rounded-4 shadow-sm text-decoration-none text-reset"
              key={item.id}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="news-card-image"
                  onError={(event) => { event.currentTarget.hidden = true; }}
                />
              ) : null}
              <div className="card-body p-4">
                <div className="small text-primary fw-semibold mb-2">{formatDate(item.published_at)}</div>
                <h5 className="fw-bold mb-2">{item.title}</h5>
                <p className="small text-muted mb-3">{item.summary || item.content}</p>
                <span className="small fw-semibold text-primary">
                  Baca berita <i className="bi bi-arrow-right ms-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
      {!isLoading && !slug && !articles.length && !message ? (
        <div className="card border-0 rounded-4 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="bi bi-newspaper fs-1 text-muted" />
            <h5 className="fw-bold mt-3">Belum ada berita</h5>
            <p className="small text-muted mb-0">Berita baru akan muncul di sini.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page-shell">
      <section className="page-hero compact">
        <p className="eyebrow">404</p>
        <h1>页面未找到</h1>
        <p>该链接可能来自旧站，或内容尚未迁移。</p>
        <Link className="button primary" href="/">
          返回首页
        </Link>
      </section>
    </main>
  );
}

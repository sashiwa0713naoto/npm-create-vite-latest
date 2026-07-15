import React, { useState } from "react";
import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import ChatBotFloating from "./components/ui/ChatBotFloating.jsx";

import Hero from "./components/sections/Hero.jsx";
import Services, { SERVICES_DATA } from "./components/sections/Services.jsx";
import ServiceDetail from "./components/sections/ServiceDetail.jsx";
import Showcase from "./components/sections/Showcase.jsx";
import ShowcaseDetail from "./components/sections/ShowcaseDetail.jsx";
import Team from "./components/sections/Team.jsx";
import News from "./components/sections/News.jsx";
import Blog from "./components/sections/Blog.jsx";
import Contact from "./components/sections/Contact.jsx";

export default function App() {
  // 💡 詳細ページの切り替えは、この2つのstateだけで管理しています。
  //    どちらもnullのときはトップページ、どちらかに値が入っているときは詳細ページを表示します。
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedShowcaseItem, setSelectedShowcaseItem] = useState(null);

  const selectedService = SERVICES_DATA.find((s) => s.id === selectedServiceId) || null;
  const isDetailView = Boolean(selectedService || selectedShowcaseItem);

  const handleSelectService = (id) => {
    setSelectedServiceId(id);
    setSelectedShowcaseItem(null);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const handleSelectShowcase = (item) => {
    setSelectedShowcaseItem(item);
    setSelectedServiceId(null);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const handleBack = () => {
    setSelectedServiceId(null);
    setSelectedShowcaseItem(null);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const handleGoContact = () => {
    setSelectedServiceId(null);
    setSelectedShowcaseItem(null);
    setTimeout(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  // 💡 詳細ページ表示中にヘッダー/フッターのナビが押された場合は、
  //    一度トップページに戻ってから、該当セクションへスクロールします。
  const handleNavigate = (id) => {
    if (isDetailView) {
      setSelectedServiceId(null);
      setSelectedShowcaseItem(null);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      <Header onNavigate={isDetailView ? handleNavigate : undefined} />

      {selectedService ? (
        <ServiceDetail service={selectedService} onBack={handleBack} onGoContact={handleGoContact} />
      ) : selectedShowcaseItem ? (
        <ShowcaseDetail item={selectedShowcaseItem} onBack={handleBack} onGoContact={handleGoContact} />
      ) : (
        <main>
          <Hero />
          <Services onSelectService={handleSelectService} />
          <Showcase onSelectItem={handleSelectShowcase} />
          <Team />
          <News />
          <Blog />
          <Contact />
        </main>
      )}

      <Footer onNavigate={isDetailView ? handleNavigate : undefined} />

      <ChatBotFloating />
    </div>
  );
}

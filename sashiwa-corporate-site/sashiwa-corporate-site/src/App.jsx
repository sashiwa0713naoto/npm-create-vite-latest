import React from "react";
import LiveActivity from "./components/layout/LiveActivity.jsx";
import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import ChatBotFloating from "./components/ui/ChatBotFloating.jsx";

import Hero from "./components/sections/Hero.jsx";
import Services from "./components/sections/Services.jsx";
import Showcase from "./components/sections/Showcase.jsx";
import Team from "./components/sections/Team.jsx";
import News from "./components/sections/News.jsx";
import Blog from "./components/sections/Blog.jsx";
import Contact from "./components/sections/Contact.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      {/* AI稼働ログのティッカー */}
      <LiveActivity />
      <Header />

      <main>
        <Hero />
        <Services />
        <Showcase />
        <Team />
        <News />
        <Blog />
        <Contact />
      </main>

      <Footer />

      {/* 右下常駐のAIコンシェルジュ */}
      <ChatBotFloating />
    </div>
  );
}

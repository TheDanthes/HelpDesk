module.exports = {
  locales: ["en", "da", "de", "es", "fr", "no", "pt", "se", "tl", "is" ,"it", "he", "tr", "hu", "th", "zh-CN"],
  defaultLocale: "en",
  pages: {
    "*": ["peppermint"],
  },
  localeDetection: false,
  loadLocaleFrom: async (lang, ns) => {
    const base = await import(`./locales/en/${ns}.json`).then(
      (m) => m.default
    );

    if (lang === "en") {
      return base;
    }

    try {
      const locale = await import(`./locales/${lang}/${ns}.json`).then(
        (m) => m.default
      );
      return { ...base, ...locale };
    } catch (error) {
      return base;
    }
  },
};

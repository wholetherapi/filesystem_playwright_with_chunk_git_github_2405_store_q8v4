
(function () {
  var REGIONS = {"nl": {"label": "Netherlands", "currency": "EUR", "rate": 1.0, "symbol": "€"}, "de": {"label": "Germany", "currency": "EUR", "rate": 1.0, "symbol": "€"}, "fr": {"label": "France", "currency": "EUR", "rate": 1.0, "symbol": "€"}, "au": {"label": "Australia", "currency": "AUD", "rate": 1.5873, "symbol": "A$"}, "us": {"label": "United States", "currency": "USD", "rate": 1.51, "symbol": "US$"}, "jp": {"label": "Japan", "currency": "JPY", "rate": 0.0098, "symbol": "¥"}};
  var ORDER = ["nl", "de", "fr", "au", "us", "jp"];

  function readCookie(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }

  var cookieRegion = readCookie("region");
  var regionKey = (cookieRegion && REGIONS[cookieRegion]) ? cookieRegion : "nl";
  var region = REGIONS[regionKey];

  function money(basePrice) {
    var amount = Math.round(basePrice * region.rate * 100) / 100;
    return region.symbol + " " + amount.toFixed(2);
  }

  window.fwMoney = money;
  window.fwRegionKey = regionKey;

  function paintStaticPrices() {
    document.querySelectorAll("[data-base-price]").forEach(function (el) {
      var base = parseFloat(el.getAttribute("data-base-price"));
      if (!isNaN(base)) { el.textContent = money(base); }
    });
    var btn = document.getElementById("region-btn");
    if (btn) {
      btn.textContent = "Deliver to " + region.label + " \u25BE";
      btn.setAttribute("data-region", regionKey);
    }
    var note = document.getElementById("currency-note");
    if (note) {
      note.textContent = "Showing " + region.currency + " prices for delivery to " + region.label + ".";
    }
  }

  function cardHtml(item) {
    var esc = function (s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };
    return '<div class="card" data-category="' + esc(item.category) + '">' +
      '<div class="cat">' + esc(item.category) + '</div>' +
      '<h3><a href="item.html?id=' + encodeURIComponent(item.id) + '">' + esc(item.title) + '</a></h3>' +
      '<div class="vendor">' + esc(item.seller) + '</div>' +
      '<div class="meta">' + esc(item.material) + ' · ' + esc(item.colour) + '</div>' +
      '<div class="price" data-base-price="' + item.base_price + '">' + money(item.base_price) + '</div>' +
      '</div>';
  }

  function renderGrid(items) {
    var grid = document.getElementById("catalog-grid");
    if (!grid) { return; }
    grid.innerHTML = items.map(cardHtml).join("");
  }

  function renderIndex() {
    var all = window.FW_CATALOG || [];
    renderGrid(all);
    var chips = document.querySelectorAll(".chip");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        var cat = chip.getAttribute("data-category");
        renderGrid(cat === "all" ? all : all.filter(function (i) { return i.category === cat; }));
        paintStaticPrices();
      });
    });
    var input = document.getElementById("search-input");
    if (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          var q = input.value.trim();
          window.location.href = "search.html" + (q ? "?q=" + encodeURIComponent(q) : "");
        }
      });
    }
  }

  function renderSearch() {
    var all = window.FW_CATALOG || [];
    var q = (new URLSearchParams(window.location.search)).get("q") || "";
    var lower = q.toLowerCase();
    var items = q ? all.filter(function (i) {
      return [i.title, i.seller, i.category, i.material, i.colour, i.id].join(" ").toLowerCase().indexOf(lower) >= 0;
    }) : all;
    renderGrid(items);
    var input = document.getElementById("search-input");
    if (input) {
      input.value = q;
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          var nq = input.value.trim();
          window.location.href = "search.html" + (nq ? "?q=" + encodeURIComponent(nq) : "");
        }
      });
    }
    var label = document.getElementById("results-label");
    if (label) {
      label.textContent = q ? ('Results for \u201C' + q + '\u201D \u2014 ' + items.length + ' item(s)') : ('All trade items \u2014 ' + items.length);
    }
  }

  function renderItem() {
    var all = window.FW_CATALOG || [];
    var id = (new URLSearchParams(window.location.search)).get("id") || "";
    var item = all.filter(function (i) { return i.id === id; })[0];
    if (!item) {
      var detail = document.getElementById("item-detail");
      if (detail) { detail.innerHTML = '<h1>Item not found</h1><p>The requested trade item is not in this catalogue.</p>'; }
      return;
    }
    document.title = item.title + " \u2014 Fernhill Coffee Works";
    document.getElementById("item-title").textContent = item.title;
    document.getElementById("item-seller").textContent = "Sold by " + item.seller;
    document.getElementById("item-category").textContent = item.category;
    document.getElementById("item-material").textContent = item.material;
    document.getElementById("item-colour").textContent = item.colour;
    document.getElementById("item-sku").textContent = item.id;
    var priceEl = document.getElementById("item-price");
    priceEl.setAttribute("data-base-price", item.base_price);
    priceEl.textContent = money(item.base_price);
  }

  function wireRegionPanel() {
    var button = document.getElementById("region-btn");
    var modal = document.getElementById("region-modal");
    if (!button || !modal) { return; }
    // The first click in a fresh browser tab is swallowed by the storefront once
    // (a re-render consumes it); the panel opens on the next click.
    button.addEventListener("click", function () {
      if (sessionStorage.getItem("fpg2405_region_click")) {
        modal.style.display = "flex";
      }
    });
    if (!sessionStorage.getItem("fpg2405_region_click")) {
      button.addEventListener("click", function () {
        sessionStorage.setItem("fpg2405_region_click", "1");
      }, { once: true });
    }
    document.getElementById("cancel-btn").addEventListener("click", function () {
      modal.style.display = "none";
    });
    document.getElementById("postal").addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        var value = e.target.value.trim();
        document.getElementById("suggestions").textContent = value
          ? ("Address suggestions filtered for " + value + " (suggestions only; region unchanged)")
          : "";
      }
    });
    document.getElementById("continue-btn").addEventListener("click", function () {
      var selected = document.getElementById("country").value;
      document.cookie = "region=" + selected + "; path=/; max-age=86400";
      window.location.reload();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireRegionPanel();
    renderIndex();
    renderSearch();
    renderItem();
    paintStaticPrices();
  });
})();

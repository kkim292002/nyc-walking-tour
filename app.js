(function () {
  "use strict";

  const tours = window.NYC_TOURS || [];
  const activeTour = tours.find((tour) => tour.status === "published");
  if (!activeTour) return;

  const STORAGE_KEY = "nyc-walking-tour:v1";
  let position = null;
  let toastTimer = null;

  const loadState = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { visited: {}, checks: {} };
    } catch (_) {
      return { visited: {}, checks: {} };
    }
  };

  const state = loadState();

  const saveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      showToast("기록을 저장할 수 없습니다. 브라우저 저장 설정을 확인해 주세요.");
    }
  };

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const googleMapsUrl = (stop) => {
    const destination = encodeURIComponent(`${stop.lat},${stop.lng}`);
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
  };

  const renderFutureTours = () => {
    const container = document.querySelector("#futureTours");
    container.innerHTML = tours.filter((tour) => tour.status === "planned").map((tour) => `
      <article class="future-item">
        <span>${String(tour.part).padStart(2, "0")}</span>
        <strong>${escapeHtml(tour.titleKo)}</strong>
        <small>${escapeHtml(tour.area)}</small>
      </article>
    `).join("");
  };

  const renderStops = () => {
    const container = document.querySelector("#stopList");
    container.innerHTML = activeTour.stops.map((stop) => {
      const visited = Boolean(state.visited[stop.id]);
      const checks = state.checks[stop.id] || {};
      return `
        <article class="stop-card ${visited ? "is-visited" : ""}" id="stop-${stop.id}" data-stop-id="${stop.id}">
          <span class="stop-marker" aria-hidden="true">${visited ? "✓" : String(stop.number).padStart(2, "0")}</span>
          <div class="stop-panel">
            <div class="stop-main">
              <div class="stop-kicker"><span>STOP ${String(stop.number).padStart(2, "0")} · ${escapeHtml(stop.area)}</span><span class="distance-badge" data-distance="${stop.id}"></span></div>
              <h2>${escapeHtml(stop.nameKo)} <small>${escapeHtml(stop.nameEn)}</small></h2>
              <p class="summary">${escapeHtml(stop.summary)}</p>
              <div class="checklist">
                <p class="checklist-title">현장에서 직접 확인하기</p>
                ${stop.checks.map((item, index) => `
                  <label class="check-item">
                    <input type="checkbox" data-check-stop="${stop.id}" data-check-index="${index}" ${checks[index] ? "checked" : ""}>
                    <span class="check-box" aria-hidden="true"></span>
                    <span>${escapeHtml(item)}</span>
                  </label>
                `).join("")}
              </div>
              <div class="stop-actions">
                <a class="action-link" href="${googleMapsUrl(stop)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(stop.nameKo)}까지 Google Maps 도보 길찾기">길찾기 ↗</a>
                <a class="guide-link" href="#guide/${stop.id}">상세 해설</a>
                <button class="visit-button" type="button" data-visit="${stop.id}" aria-pressed="${visited}">${visited ? "방문 완료됨 · 취소" : "직접 방문 완료 체크"}</button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join("");
    if (position) updateDistances();
  };

  const renderGuide = () => {
    const toc = document.querySelector("#guideToc");
    const article = document.querySelector("#guideArticle");
    toc.innerHTML = activeTour.stops.map((stop) => `<a href="#guide/${stop.id}">${String(stop.number).padStart(2, "0")} ${escapeHtml(stop.nameKo)}</a>`).join("");
    article.innerHTML = `
      <section class="guide-chapter" id="guide-intro">
        <span class="guide-chapter-number">INTRODUCTION</span>
        <h2>843에이커의 자연은 어떻게 설계되었나</h2>
        <p>센트럴 파크의 나무와 물, 구불구불한 길은 오래전부터 그 자리에 있었던 듯 보입니다. 그러나 19세기 중반의 뉴욕은 빠르게 팽창하고 있었고, 시인 윌리엄 컬런 브라이언트와 조경 사상가 앤드루 잭슨 다우닝 등이 대규모 공원의 필요성을 주장했습니다. 1850년대 설계 공모에는 30개가 넘는 안이 제출되었고, 조경가 프레더릭 로 옴스테드와 건축가 캘버트 복스의 그린스워드 계획이 선택되었습니다.</p>
        <p>이들의 혁신은 ‘자연을 남겨 두는 것’이 아니라 도시의 교통과 사회적 요구를 받아들이면서도 자연 속에 들어온 경험을 끊지 않는 것이었습니다. 흙 500만 세제곱야드 이상을 옮기고, 나무와 관목 50만 그루 이상을 심고, 호수와 연못을 파냈습니다. 노출된 맨해튼 편암조차 꺼내고 씻고 다듬어 장면 속에 배치했습니다.</p>
        <p>이 가이드의 순서는 남쪽에서 북쪽으로, ‘도시의 문제를 숨기는 설계’에서 ‘도시를 다시 보여 주는 전망’으로 이어집니다. GPS는 거리를 가늠하는 보조도구일 뿐입니다. 각 정거장에서 화면을 잠시 내려놓고 소리, 높이 차, 재료, 시선의 방향을 직접 확인해 보세요.</p>
        <div class="look-card"><strong>투어 원칙</strong><p>현장 방문 완료는 자동으로 기록되지 않습니다. 충분히 보고 들었다고 느낄 때 직접 완료 버튼을 누르세요.</p></div>
      </section>
      ${activeTour.stops.map((stop) => `
        <section class="guide-chapter" id="guide-${stop.id}">
          <span class="guide-chapter-number">CHAPTER ${String(stop.number).padStart(2, "0")} · ${escapeHtml(stop.area)}</span>
          <h2>${escapeHtml(stop.guideTitle)}</h2>
          ${stop.guideHtml}
          <a class="action-link" href="${googleMapsUrl(stop)}" target="_blank" rel="noopener noreferrer">${escapeHtml(stop.nameKo)}로 걷기 ↗</a>
        </section>
      `).join("")}
    `;
  };

  const updateProgress = () => {
    const total = activeTour.stops.length;
    const done = activeTour.stops.filter((stop) => state.visited[stop.id]).length;
    const percent = Math.round((done / total) * 100);
    document.querySelector("#homeProgressCount").textContent = done;
    document.querySelector("#routeProgressText").textContent = `${done} / ${total}`;
    document.querySelector("#routeProgressBar").style.width = `${percent}%`;
    const ring = document.querySelector("#progressRing");
    ring.style.setProperty("--progress", `${percent * 3.6}deg`);
    ring.querySelector("span").textContent = `${percent}%`;
    ring.setAttribute("aria-label", `진행률 ${percent}퍼센트`);
  };

  const showToast = (message) => {
    const toast = document.querySelector("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2300);
  };

  const switchView = (hash) => {
    const raw = (hash || "#home").replace(/^#/, "");
    const [viewName, anchor] = raw.split("/");
    const validView = ["home", "route", "guide"].includes(viewName) ? viewName : "home";
    document.querySelectorAll(".view").forEach((view) => view.classList.toggle("is-active", view.dataset.view === validView));
    document.querySelectorAll("[data-nav]").forEach((item) => {
      const active = item.dataset.nav === validView;
      item.classList.toggle("is-active", active);
      active ? item.setAttribute("aria-current", "page") : item.removeAttribute("aria-current");
    });

    if (anchor && validView === "guide") {
      requestAnimationFrame(() => document.querySelector(`#guide-${CSS.escape(anchor)}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  };

  const distanceMeters = (aLat, aLng, bLat, bLng) => {
    const radius = 6371000;
    const toRad = (degree) => degree * Math.PI / 180;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const value = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 2 * radius * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  };

  const formatDistance = (meters) => meters < 1000 ? `약 ${Math.max(10, Math.round(meters / 10) * 10)}m` : `약 ${(meters / 1000).toFixed(1)}km`;

  const updateDistances = () => {
    if (!position) return;
    activeTour.stops.forEach((stop) => {
      const element = document.querySelector(`[data-distance="${stop.id}"]`);
      if (element) element.textContent = formatDistance(distanceMeters(position.lat, position.lng, stop.lat, stop.lng));
    });
  };

  const requestLocation = () => {
    const status = document.querySelector("#locationStatus");
    if (!navigator.geolocation) {
      status.textContent = "이 브라우저에서는 위치 기능을 사용할 수 없습니다.";
      return;
    }
    status.textContent = "현재 위치를 확인하는 중…";
    navigator.geolocation.getCurrentPosition((result) => {
      position = { lat: result.coords.latitude, lng: result.coords.longitude };
      updateDistances();
      const nearest = activeTour.stops
        .map((stop) => ({ stop, meters: distanceMeters(position.lat, position.lng, stop.lat, stop.lng) }))
        .sort((a, b) => a.meters - b.meters)[0];
      status.textContent = `가장 가까운 정거장: ${nearest.stop.nameKo} · ${formatDistance(nearest.meters)} (정확도 ±${Math.round(result.coords.accuracy)}m)`;
      showToast("현재 위치를 기준으로 거리를 표시했습니다.");
    }, (error) => {
      const messages = {
        1: "위치 권한이 꺼져 있습니다. iPhone 설정에서 Safari 위치 권한을 확인해 주세요.",
        2: "현재 위치를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.",
        3: "위치 확인 시간이 초과되었습니다. 하늘이 보이는 곳에서 다시 시도해 주세요."
      };
      status.textContent = messages[error.code] || "위치를 확인하지 못했습니다.";
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  };

  const bindEvents = () => {
    window.addEventListener("hashchange", () => switchView(window.location.hash));
    document.querySelector("#startTourButton").addEventListener("click", () => { window.location.hash = "route"; });
    document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => { window.location.hash = button.dataset.go; }));
    document.querySelector("#locateButton").addEventListener("click", requestLocation);

    document.querySelector("#stopList").addEventListener("change", (event) => {
      const input = event.target.closest("[data-check-stop]");
      if (!input) return;
      const stopId = input.dataset.checkStop;
      state.checks[stopId] ||= {};
      state.checks[stopId][input.dataset.checkIndex] = input.checked;
      saveState();
    });

    document.querySelector("#stopList").addEventListener("click", (event) => {
      const button = event.target.closest("[data-visit]");
      if (!button) return;
      const stopId = button.dataset.visit;
      state.visited[stopId] = !state.visited[stopId];
      saveState();
      renderStops();
      updateProgress();
      showToast(state.visited[stopId] ? "방문을 직접 완료로 기록했습니다." : "방문 완료 기록을 취소했습니다.");
    });

    const dialog = document.querySelector("#helpDialog");
    document.querySelector("#helpButton").addEventListener("click", () => dialog.showModal());
    document.querySelector("#helpClose").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });

    window.addEventListener("offline", () => showToast("오프라인 모드입니다. 저장된 가이드는 계속 사용할 수 있습니다."));
    window.addEventListener("online", () => showToast("인터넷 연결이 복구되었습니다."));
  };

  const registerServiceWorker = () => {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        showToast("오프라인 저장 준비에 실패했습니다. 페이지를 새로고침해 주세요.");
      });
    });
  };

  renderFutureTours();
  renderStops();
  renderGuide();
  updateProgress();
  bindEvents();
  switchView(window.location.hash);
  registerServiceWorker();
})();

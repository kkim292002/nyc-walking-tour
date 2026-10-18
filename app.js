(function () {
  "use strict";

  const tours = window.NYC_TOURS || [];
  const activeTour = tours.find((tour) => tour.status === "published");
  if (!activeTour || !window.L) return;

  const STORAGE_KEY = "nyc-walking-tour:v2";
  const DEFAULT_CENTER = [40.7747, -73.9712];
  let position = null;
  let radiusMeters = 800;
  let watchId = null;
  let firstLocationFix = true;
  let toastTimer = null;
  let userMarker = null;
  let accuracyCircle = null;
  const markerMap = new Map();

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

  const distanceMeters = (aLat, aLng, bLat, bLng) => {
    const earthRadius = 6371000;
    const toRad = (degree) => degree * Math.PI / 180;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const value = Math.sin(dLat / 2) ** 2
      + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 2 * earthRadius * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  };

  const formatDistance = (meters) => {
    if (meters == null) return "";
    if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)}m`;
    return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)}km`;
  };

  const markerFor = (stop) => stop.marker || String(stop.number || "•");
  const categoryFor = (stop) => stop.category || stop.area || "흥미로운 장소";
  const talkingPointFor = (stop) => stop.talkingPoint || stop.summary || "이 장소의 자세한 이야기를 가이드에서 확인해 보세요.";

  const radiusLabel = () => radiusMeters === 2000 ? "2km" : `${radiusMeters}m`;

  const stopsWithDistance = () => activeTour.stops
    .map((stop) => ({
      ...stop,
      distance: position ? distanceMeters(position.lat, position.lng, stop.lat, stop.lng) : null
    }))
    .sort((a, b) => position ? a.distance - b.distance : a.number - b.number);

  const showToast = (message) => {
    const toast = document.querySelector("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2300);
  };

  const makeMarkerIcon = (stop) => {
    const isNearby = position && distanceMeters(position.lat, position.lng, stop.lat, stop.lng) <= radiusMeters;
    const visited = Boolean(state.visited[stop.id]);
    return L.divIcon({
      className: "leaflet-div-icon",
      html: `<div class="map-marker ${isNearby ? "is-nearby" : ""} ${visited ? "is-visited" : ""}"><span>${escapeHtml(markerFor(stop))}</span></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 38],
      popupAnchor: [0, -35]
    });
  };

  const map = L.map("map", {
    zoomControl: false,
    attributionControl: false,
    minZoom: 12,
    maxZoom: 19
  }).setView(DEFAULT_CENTER, 15);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
  })
    .on("tileerror", () => { document.querySelector("#mapOffline").hidden = false; })
    .addTo(map);
  L.control.zoom({ position: "topright" }).addTo(map);

  activeTour.stops.forEach((stop) => {
    const marker = L.marker([stop.lat, stop.lng], { icon: makeMarkerIcon(stop), title: stop.nameKo })
      .addTo(map);
    marker.on("click", () => {
      window.location.hash = `guide/${stop.id}`;
    });
    markerMap.set(stop.id, marker);
  });
  map.fitBounds(L.latLngBounds(activeTour.stops.map((stop) => [stop.lat, stop.lng])), { padding: [35, 35] });

  const updateMarkerIcons = () => {
    activeTour.stops.forEach((stop) => markerMap.get(stop.id)?.setIcon(makeMarkerIcon(stop)));
  };

  const scrollNearbyCard = (stopId) => {
    document.querySelector(`[data-nearby-id="${stopId}"]`)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  const focusStop = (stopId) => {
    const stop = activeTour.stops.find((item) => item.id === stopId);
    if (!stop) return;
    map.flyTo([stop.lat, stop.lng], 17, { duration: .7 });
    setTimeout(() => scrollNearbyCard(stopId), 250);
  };

  const renderNearby = () => {
    const all = stopsWithDistance();
    let shown = position ? all.filter((stop) => stop.distance <= radiusMeters) : all;
    let fallback = false;
    if (position && shown.length === 0) {
      shown = all.slice(0, 1);
      fallback = true;
    }

    document.querySelector("#nearbyCount").textContent = position
      ? (fallback ? "가장 가까운 1곳" : `${shown.length}곳`)
      : `${all.length}곳`;
    document.querySelector("#nearbyCards").innerHTML = shown.map((stop) => `
      <article class="nearby-card ${fallback ? "is-outside" : ""}" data-nearby-id="${stop.id}" tabindex="0" role="button" aria-label="${escapeHtml(stop.nameKo)} 상세 설명 보기">
        <span class="point-symbol" aria-hidden="true">${escapeHtml(markerFor(stop))}</span>
        <div>
          <div class="nearby-meta"><span>${escapeHtml(categoryFor(stop))}</span>${stop.distance != null ? `<span>· ${formatDistance(stop.distance)}</span>` : ""}</div>
          <h3>${escapeHtml(stop.nameKo)}</h3>
          <p>${escapeHtml(talkingPointFor(stop))}</p>
          <span class="nearby-detail-link">상세 설명 보기 →</span>
        </div>
      </article>
    `).join("");
  };

  const renderPoints = () => {
    const stops = stopsWithDistance();
    document.querySelector("#pointsSortLabel").textContent = position ? "현재 위치에서 가까운 순" : `전체 ${stops.length}곳`;
    document.querySelector("#pointsList").innerHTML = stops.map((stop) => {
      const visited = Boolean(state.visited[stop.id]);
      const checks = state.checks[stop.id] || {};
      return `
        <article class="point-card ${visited ? "is-visited" : ""}" id="point-${stop.id}">
          <div class="point-card-head">
            <span class="point-symbol" aria-hidden="true">${escapeHtml(markerFor(stop))}</span>
            <div>
              <div class="nearby-meta">${escapeHtml(categoryFor(stop))}</div>
              <h2>${escapeHtml(stop.nameKo)}<small>${escapeHtml(stop.nameEn)}</small></h2>
            </div>
            <span class="point-distance">${stop.distance != null ? formatDistance(stop.distance) : ""}</span>
          </div>
          <p class="talking-point"><strong>일행에게 들려줄 한 문장</strong>${escapeHtml(talkingPointFor(stop))}</p>
          <div class="point-actions">
            <button class="detail-button" type="button" data-guide-stop="${stop.id}">상세 가이드</button>
            <button type="button" data-map-stop="${stop.id}">지도에서 보기</button>
            <button type="button" data-share-stop="${stop.id}">일행에게 공유</button>
            <button class="visit-button" type="button" data-visit="${stop.id}" aria-pressed="${visited}">${visited ? "방문 완료 ✓" : "방문 완료"}</button>
          </div>
          <details class="observation-details">
            <summary>현장에서 확인할 디테일</summary>
            <div class="checklist">
              ${stop.checks.map((item, index) => `
                <label class="check-item">
                  <input type="checkbox" data-check-stop="${stop.id}" data-check-index="${index}" ${checks[index] ? "checked" : ""}>
                  <span class="check-box" aria-hidden="true"></span>
                  <span>${escapeHtml(item)}</span>
                </label>
              `).join("")}
            </div>
          </details>
        </article>
      `;
    }).join("");
  };

  const renderGuide = () => {
    document.querySelector("#guideToc").innerHTML = activeTour.stops
      .map((stop) => `<a href="#guide/${stop.id}">${escapeHtml(markerFor(stop))} · ${escapeHtml(stop.nameKo)}</a>`)
      .join("");
    document.querySelector("#guideArticle").innerHTML = `
      <section class="guide-chapter" id="guide-intro">
        <span class="guide-chapter-number">INTRODUCTION</span>
        <h2>843에이커의 자연은 어떻게 설계되었나</h2>
        <p>센트럴 파크의 나무와 물, 구불구불한 길은 오래전부터 그 자리에 있었던 듯 보입니다. 그러나 19세기 중반의 뉴욕은 빠르게 팽창하고 있었고, 시인 윌리엄 컬런 브라이언트와 조경 사상가 앤드루 잭슨 다우닝 등이 대규모 공원의 필요성을 주장했습니다. 1850년대 설계 공모에는 30개가 넘는 안이 제출되었고, 조경가 프레더릭 로 옴스테드와 건축가 캘버트 복스의 그린스워드 계획이 선택되었습니다.</p>
        <p>이들의 혁신은 ‘자연을 남겨 두는 것’이 아니라 도시의 교통과 사회적 요구를 받아들이면서도 자연 속에 들어온 경험을 끊지 않는 것이었습니다. 흙 500만 세제곱야드 이상을 옮기고, 나무와 관목 50만 그루 이상을 심고, 호수와 연못을 파냈습니다. 이 앱은 그 이야기를 정해진 순서가 아니라 현재 위치 주변의 포인트로 탐색하도록 구성했습니다.</p>
        <div class="look-card"><strong>이 앱의 사용법</strong><p>지도에서 가까운 포인트를 고르고 필요한 설명만 펼쳐보세요. GPS는 발견을 돕지만 방문 완료를 자동으로 판단하지 않습니다.</p></div>
      </section>
      ${activeTour.stops.map((stop) => `
        <section class="guide-chapter" id="guide-${stop.id}">
          <span class="guide-chapter-number">${escapeHtml(categoryFor(stop))} · POINT ${escapeHtml(markerFor(stop))}</span>
          <h2>${escapeHtml(stop.guideTitle)}</h2>
          <div class="look-card"><strong>일행에게 먼저 들려줄 한 문장</strong><p>${escapeHtml(talkingPointFor(stop))}</p></div>
          ${stop.guideHtml}
          <div class="chapter-actions">
            <button class="chapter-action" type="button" data-map-stop="${stop.id}">지도에서 보기</button>
            <button class="chapter-action" type="button" data-share-stop="${stop.id}">일행에게 공유</button>
          </div>
        </section>
      `).join("")}
    `;
  };

  const shareStop = async (stopId) => {
    const stop = activeTour.stops.find((item) => item.id === stopId);
    if (!stop) return;
    const text = `${stop.nameKo} — ${talkingPointFor(stop)}`;
    const url = googleMapsUrl(stop);
    try {
      if (navigator.share) {
        await navigator.share({ title: `NYC Walking Tour · ${stop.nameKo}`, text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        showToast("설명과 지도 링크를 복사했습니다.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") showToast("공유하지 못했습니다. 다시 시도해 주세요.");
    }
  };

  const updateUserPosition = (result) => {
    position = {
      lat: result.coords.latitude,
      lng: result.coords.longitude,
      accuracy: result.coords.accuracy
    };
    const latLng = [position.lat, position.lng];

    if (!userMarker) {
      userMarker = L.marker(latLng, {
        icon: L.divIcon({ className: "leaflet-div-icon", html: '<div class="user-marker"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
        title: "내 위치",
        zIndexOffset: 1000
      }).addTo(map);
      accuracyCircle = L.circle(latLng, { radius: position.accuracy, color: "#147bd1", weight: 1, fillOpacity: .08 }).addTo(map);
    } else {
      userMarker.setLatLng(latLng);
      accuracyCircle.setLatLng(latLng).setRadius(position.accuracy);
    }

    const all = stopsWithDistance();
    const within = all.filter((stop) => stop.distance <= radiusMeters);
    document.querySelector("#locationStatus").textContent = within.length
      ? `현재 위치 기준 · ${radiusLabel()} 안에 ${within.length}곳 · 정확도 ±${Math.round(position.accuracy)}m`
      : `${radiusLabel()} 안에는 포인트가 없습니다. 가장 가까운 곳은 ${all[0].nameKo} · ${formatDistance(all[0].distance)}`;

    if (firstLocationFix && all[0].distance < 10000) {
      map.flyTo(latLng, 16, { duration: .8 });
      firstLocationFix = false;
    }
    renderNearby();
    renderPoints();
    updateMarkerIcons();
  };

  const locationError = (error) => {
    const messages = {
      1: "위치 권한이 꺼져 있습니다. iPhone 설정에서 Safari 위치 권한을 확인해 주세요.",
      2: "현재 위치를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      3: "위치 확인 시간이 초과되었습니다. 하늘이 보이는 곳에서 다시 시도해 주세요."
    };
    document.querySelector("#locationStatus").textContent = messages[error.code] || "위치를 확인하지 못했습니다.";
    stopLocationWatch();
  };

  const startLocationWatch = () => {
    if (!navigator.geolocation) {
      document.querySelector("#locationStatus").textContent = "이 브라우저에서는 위치 기능을 사용할 수 없습니다.";
      return;
    }
    if (watchId != null) {
      stopLocationWatch();
      showToast("위치 추적을 멈췄습니다.");
      return;
    }
    document.querySelector("#locationStatus").textContent = "현재 위치를 확인하는 중…";
    const button = document.querySelector("#locateButton");
    button.setAttribute("aria-pressed", "true");
    button.querySelector("b").textContent = "추적 중";
    watchId = navigator.geolocation.watchPosition(updateUserPosition, locationError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 15000
    });
  };

  const stopLocationWatch = () => {
    if (watchId != null && navigator.geolocation) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    const button = document.querySelector("#locateButton");
    button.setAttribute("aria-pressed", "false");
    button.querySelector("b").textContent = "내 위치";
  };

  const toggleVisit = (stopId) => {
    state.visited[stopId] = !state.visited[stopId];
    saveState();
    renderPoints();
    renderNearby();
    updateMarkerIcons();
    showToast(state.visited[stopId] ? "방문 완료로 직접 기록했습니다." : "방문 기록을 취소했습니다.");
  };

  const switchView = (hash) => {
    const raw = (hash || "#map").replace(/^#/, "");
    const [viewName, anchor] = raw.split("/");
    const validView = ["map", "points", "guide"].includes(viewName) ? viewName : "map";
    document.querySelectorAll(".view").forEach((view) => view.classList.toggle("is-active", view.dataset.view === validView));
    document.querySelectorAll("[data-nav]").forEach((item) => {
      const active = item.dataset.nav === validView;
      item.classList.toggle("is-active", active);
      active ? item.setAttribute("aria-current", "page") : item.removeAttribute("aria-current");
    });

    if (validView === "map") {
      setTimeout(() => {
        map.invalidateSize();
        if (anchor) focusStop(anchor);
      }, 80);
    } else if (validView === "guide" && anchor) {
      requestAnimationFrame(() => document.getElementById(`guide-${anchor}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } else {
      setTimeout(() => {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      }, 0);
    }
  };

  const bindEvents = () => {
    window.addEventListener("hashchange", () => switchView(window.location.hash));
    document.querySelector("#locateButton").addEventListener("click", startLocationWatch);
    document.querySelector("#pointsLocateButton").addEventListener("click", () => {
      window.location.hash = "map";
      if (position) {
        setTimeout(() => map.flyTo([position.lat, position.lng], 16, { duration: .7 }), 100);
      } else {
        setTimeout(startLocationWatch, 100);
      }
    });

    document.querySelectorAll("[data-radius]").forEach((button) => button.addEventListener("click", () => {
      radiusMeters = Number(button.dataset.radius);
      document.querySelectorAll("[data-radius]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderNearby();
      updateMarkerIcons();
      if (position) updateUserPosition({ coords: { latitude: position.lat, longitude: position.lng, accuracy: position.accuracy } });
    }));

    document.querySelector("#nearbyCards").addEventListener("click", (event) => {
      const card = event.target.closest("[data-nearby-id]");
      if (card) window.location.hash = `guide/${card.dataset.nearbyId}`;
    });
    document.querySelector("#nearbyCards").addEventListener("keydown", (event) => {
      const card = event.target.closest("[data-nearby-id]");
      if (card && ["Enter", " "].includes(event.key)) {
        event.preventDefault();
        window.location.hash = `guide/${card.dataset.nearbyId}`;
      }
    });

    const handleActions = (event) => {
      const mapButton = event.target.closest("[data-map-stop]");
      const guideButton = event.target.closest("[data-guide-stop]");
      const shareButton = event.target.closest("[data-share-stop]");
      const visitButton = event.target.closest("[data-visit]");
      if (guideButton) {
        window.location.hash = `guide/${guideButton.dataset.guideStop}`;
      } else if (mapButton) {
        window.location.hash = `map/${mapButton.dataset.mapStop}`;
      } else if (shareButton) {
        shareStop(shareButton.dataset.shareStop);
      } else if (visitButton) {
        toggleVisit(visitButton.dataset.visit);
      }
    };
    document.querySelector("#pointsList").addEventListener("click", handleActions);
    document.querySelector("#guideArticle").addEventListener("click", handleActions);

    document.querySelector("#pointsList").addEventListener("change", (event) => {
      const input = event.target.closest("[data-check-stop]");
      if (!input) return;
      state.checks[input.dataset.checkStop] ||= {};
      state.checks[input.dataset.checkStop][input.dataset.checkIndex] = input.checked;
      saveState();
    });

    const dialog = document.querySelector("#helpDialog");
    document.querySelector("#helpButton").addEventListener("click", () => dialog.showModal());
    document.querySelector("#helpClose").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

    const updateOnlineState = () => {
      document.querySelector("#mapOffline").hidden = navigator.onLine;
      if (!navigator.onLine) showToast("오프라인입니다. 포인트와 가이드는 계속 사용할 수 있습니다.");
    };
    window.addEventListener("offline", updateOnlineState);
    window.addEventListener("online", updateOnlineState);
    updateOnlineState();
  };

  const registerServiceWorker = () => {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js?v=5").catch(() => showToast("오프라인 저장 준비에 실패했습니다."));
    });
  };

  renderNearby();
  renderPoints();
  renderGuide();
  bindEvents();
  switchView(window.location.hash);
  registerServiceWorker();
})();

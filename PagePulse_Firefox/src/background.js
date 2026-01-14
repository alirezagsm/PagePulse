let reloadIntervals = {};

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	const tabId = request.tabId;
	if (request.action === "startReload") {
		const frequency = request.frequency;
		if (reloadIntervals[tabId]) {
			clearInterval(reloadIntervals[tabId]);
		}
		reloadIntervals[tabId] = setInterval(() => {
			browser.tabs.reload(tabId);
		}, frequency * 1000);
		browser.storage.local.set({
			[`reloadFrequency_${tabId}`]: frequency,
			[`isReloading_${tabId}`]: true,
		});
		browser.action.setIcon({
			path: "../images/reload-active.png",
			tabId: tabId,
		});
		sendResponse({ status: "Reload started for tab " + tabId });
	} else if (request.action === "stopReload") {
		if (reloadIntervals[tabId]) {
			clearInterval(reloadIntervals[tabId]);
			delete reloadIntervals[tabId];
		}
		browser.storage.local.set({
			[`isReloading_${tabId}`]: false,
		});
		browser.action.setIcon({ path: "../images/reload.png", tabId: tabId });
		sendResponse({ status: "Reload stopped for tab " + tabId });
	}
});

browser.runtime.onStartup.addListener(() => {
	browser.storage.local.get(null).then((data) => {
		for (const key in data) {
			if (key.startsWith("isReloading_") && data[key]) {
				const tabId = parseInt(key.split("_")[1], 10);
				const frequency = data[`reloadFrequency_${tabId}`];
				reloadIntervals[tabId] = setInterval(() => {
					browser.tabs.reload(tabId);
				}, frequency * 1000);
				browser.action.setIcon({
					path: "../images/reload-active.png",
					tabId: tabId,
				});
			}
		}
	});
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === "complete") {
		browser.storage.local.get([`isReloading_${tabId}`]).then((data) => {
			if (data[`isReloading_${tabId}`]) {
				browser.action.setIcon({
					path: "../images/reload-active.png",
					tabId: tabId,
				});
			} else {
				browser.action.setIcon({
					path: "../images/reload.png",
					tabId: tabId,
				});
			}
		});
	}
});

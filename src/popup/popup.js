document.addEventListener("DOMContentLoaded", function () {
	const frequencyInput = document.getElementById("frequency");
	const startButton = document.getElementById("start");
	const stopButton = document.getElementById("stop");

	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		if (tabs[0]) {
			const tabId = tabs[0].id;
			chrome.storage.local.get(
				[`reloadFrequency_${tabId}`, `isReloading_${tabId}`],
				(data) => {
					if (data[`reloadFrequency_${tabId}`]) {
						frequencyInput.value = data[`reloadFrequency_${tabId}`];
					}
					if (data[`isReloading_${tabId}`]) {
						startButton.disabled = true;
						stopButton.disabled = false;
					} else {
						startButton.disabled = false;
						stopButton.disabled = true;
					}
				}
			);
		}
	});

	startButton.addEventListener("click", function () {
		const frequency = parseInt(frequencyInput.value, 10);
		if (!isNaN(frequency) && frequency > 0) {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				if (tabs[0]) {
					const tabId = tabs[0].id;
					chrome.runtime.sendMessage({
						action: "startReload",
						frequency: frequency,
						tabId: tabId,
					});
					startButton.disabled = true;
					stopButton.disabled = false;
				}
			});
		}
	});

	stopButton.addEventListener("click", function () {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs[0]) {
				const tabId = tabs[0].id;
				chrome.runtime.sendMessage({
					action: "stopReload",
					tabId: tabId,
				});
				startButton.disabled = false;
				stopButton.disabled = true;
			}
		});
	});
});

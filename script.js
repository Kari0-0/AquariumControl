const MOCKAPI_URL = 'https://684938b045f4c0f5ee707ebf.mockapi.io/aquarium_data';

const temperatureDisplay = document.getElementById('temperature');
const phDisplay = document.getElementById('ph');
const feedButton = document.getElementById('feedButton');
const lightButton = document.getElementById('lightButton');
const logList = document.getElementById('logList');

let currentLightStatus = false;

async function fetchData() {
    try {
        const response = await fetch(MOCKAPI_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const aquariumData = data[0];

        if (aquariumData) {
            temperatureDisplay.textContent = `${aquariumData.temperature.toFixed(1)}°C`;
            phDisplay.textContent = `${aquariumData.pH.toFixed(1)}`;
            currentLightStatus = aquariumData.lighting_status;
            updateLightButtonText();
            updateLog(aquariumData.log || []);
        } else {
            await initializeAquariumData();
        }
    } catch (error) {
        console.error("Помилка завантаження даних:", error);
        temperatureDisplay.textContent = "Помилка";
        phDisplay.textContent = "Помилка";
        logList.innerHTML = '<li>Помилка завантаження логу.</li>';
    }
}

async function initializeAquariumData() {
    const initialData = {
        temperature: 25.0,
        pH: 7.0,
        feeding_status: false,
        lighting_status: false,
        log: ["Система запущена.", `Температура: 25.0°C`, `pH: 7.0`]
    };
    try {
        const response = await fetch(MOCKAPI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(initialData),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        fetchData();
    } catch (error) {
        console.error("Помилка ініціалізації даних:", error);
    }
}

async function updateData(newData) {
    try {
        const response = await fetch(MOCKAPI_URL);
        const data = await response.json();
        const currentData = data[0];

        if (!currentData) {
            console.error("Не знайдено існуючих даних для оновлення.");
            return;
        }

        const updatedData = { ...currentData, ...newData };

        const putResponse = await fetch(`${MOCKAPI_URL}/${currentData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData),
        });
        if (!putResponse.ok) {
            throw new Error(`HTTP error! status: ${putResponse.status}`);
        }
        fetchData();
    } catch (error) {
        console.error("Помилка оновлення даних:", error);
    }
}

async function addLogEntry(entry) {
    try {
        const response = await fetch(MOCKAPI_URL);
        const data = await response.json();
        const currentData = data[0];

        if (currentData) {
            const newLog = [...(currentData.log || []), `${new Date().toLocaleTimeString()} - ${entry}`];
            await updateData({ log: newLog });
        }
    } catch (error) {
        console.error("Помилка додавання запису до логу:", error);
    }
}

function updateLog(logEntries) {
    logList.innerHTML = '';
    if (logEntries && logEntries.length > 0) {
        logEntries.slice(-10).forEach(entry => {
            const li = document.createElement('li');
            li.textContent = entry;
            logList.appendChild(li);
        });
    } else {
        logList.innerHTML = '<li>Лог пустий.</li>';
    }
    logList.scrollTop = logList.scrollHeight;
}

feedButton.addEventListener('click', async () => {
    const newTemperature = (Math.random() * (26.0 - 24.5) + 24.5).toFixed(1);
    await updateData({ feeding_status: true, temperature: parseFloat(newTemperature) });
    await addLogEntry(`Риби були погодовані. Температура змінилася на ${newTemperature}°C.`);
    setTimeout(async () => {
        await updateData({ feeding_status: false });
    }, 1000);
});

lightButton.addEventListener('click', async () => {
    currentLightStatus = !currentLightStatus;
    await updateData({ lighting_status: currentLightStatus });
    await addLogEntry(`Освітлення ${currentLightStatus ? 'увімкнено' : 'вимкнено'}.`);
    updateLightButtonText();
});

function updateLightButtonText() {
    lightButton.textContent = currentLightStatus ? 'Вимкнути освітлення' : 'Увімкнути освітлення';
    if (currentLightStatus) {
        lightButton.classList.add('active');
    } else {
        lightButton.classList.remove('active');
    }
}

setInterval(async () => {
    const newTemperature = (Math.random() * (27.0 - 24.0) + 24.0).toFixed(1);
    const newpH = (Math.random() * (7.5 - 6.5) + 6.5).toFixed(1);

    await updateData({
        temperature: parseFloat(newTemperature),
        pH: parseFloat(newpH)
    });
}, 30000);

document.addEventListener('DOMContentLoaded', fetchData);
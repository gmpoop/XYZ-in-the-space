import Level from "../scripts/Levels/LevelOne/LevelOne.js";

const level = new Level;


const StartScene = async () => {
    await level.initLevel();
    level.begin();
}

StartScene();

// const audioBuffer = await loadAudio("");
// const source = audioContext.createBufferSource();
// source.buffer = audioBuffer;
// source.connect(audioContext.destination);
// source.start(0);
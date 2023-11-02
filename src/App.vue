<script setup>
import { ref } from 'vue';
import '@carbon/web-components/es/components/ui-shell/index.js';
import '@carbon/web-components/es/components/button/index.js';
import '@carbon/web-components/es/components/notification/index.js';
import '@carbon/web-components/es/components/slider/index.js';
import { connect, JSONCodec } from "nats.ws";

import Activity from '@carbon/icons-vue/es/activity/16';
</script>

<script>
const jc = new JSONCodec();
const nc = await connect({
    servers: ["ws://192.168.0.107:8000"],
});
const sub = nc.subscribe("motion.status");

import { modelRef } from './scene';
import { smc_errors } from './smc_error';
import { gamepads } from './gamepad';

let hearbeat = ref();
let hearbeatIndictor = ref();

let run = ref();
let alarm = ref();
let state = ref();
let dro = ref({
    dx: 0, dy: 0, dAlpha: 0, dBeta: 0
});
let diagmsg = ref();
let a1Error = ref();
let a2Error = ref();

let ax = ref(0);
let ay = ref(150);

setInterval(() => {
    if (hearbeat.value) {
        hearbeatIndictor.value = true;
        setTimeout(() => { hearbeatIndictor.value = false }, 100)
    } else {
        hearbeatIndictor.value = false;
    }
    hearbeat.value = false
}, 1000);

(async () => {
    for await (const m of sub) {
        let payload = jc.decode(m.data);
        run.value = payload.run;
        alarm.value = payload.alarm;
        state.value = payload.state;
        diagmsg.value = payload.diagMsg;
        // a1Error.value = payload.a1Err;
        // a2Error.value = payload.a2Err;
        dro.value.dx = payload.dx
        dro.value.dy = payload.dy
        dro.value.dAlpha = payload.dAlpha
        dro.value.dBeta = payload.dBeta
        hearbeat.value = true

        try {
            let a1Name = 'A1^scara_bot_rev3-1'
            modelRef.getObjectByName(a1Name).translateZ(0.16);
            modelRef.getObjectByName(a1Name).rotation.y = (payload.dAlpha - 90) * Math.PI / 180;
            modelRef.getObjectByName(a1Name).translateZ(-0.16);

            let a2Name = 'A2^scara_bot_rev3-1'
            modelRef.getObjectByName(a2Name).translateZ(0.360);
            modelRef.getObjectByName(a2Name).rotation.y = (payload.dBeta - 0) * Math.PI / 180;
            modelRef.getObjectByName(a2Name).translateZ(-0.360);
        } catch (e) {
            // console.log(e);
        }

        // if (gamepads[0] != undefined) {
        //     console.log(gamepads[0].axes)
        //     // ax.value += gamepads[0].axes[0];
        // }
        const gamepads = navigator.getGamepads();
        for (const gp of gamepads) {
            if (gp == null) {
                continue
            }
            ax.value += (Math.abs(gp.axes[0]) > 0.01 ? gp.axes[0] : 0);
            ay.value += (Math.abs(gp.axes[1]) > 0.01 ? gp.axes[1] : 0);
            immediate(ax.value, ay.value);
        }
    }
})();

function start() {
    nc.publish('motion.command', jc.encode({ command: 'start' }))
}
function stop() {
    nc.publish('motion.command', jc.encode({ command: 'stop' }))
}
function reset() {
    nc.publish('motion.command', jc.encode({ command: 'reset' }))
}
function updatePath(gcode) {
    nc.publish('motion.command', jc.encode({
        command: 'gcode', position: [
            { x: 0, y: 170, vel: 100 }, { x: -100, y: 100, vel: 6000 }, { x: -200, y: 280, vel: 5000 }, { x: 200, y: 170, vel: 5000 }, { x: 0, y: 170 }]
    }))
    // nc.publish('motion.command', jc.encode({ command: 'gcode', position: [
    //     { x: 0, y: 80, vel: 6000 }, { x: 0, y: 300, vel: 6000 }, { x: 100, y: 100, vel: 6000 }, { x: 100, y: -250, vel: 6000 }, { x: 0, y: 80, vel: 6000 }
    // ]}))
}
function immediate(x, y) {
    nc.publish('motion.command', jc.encode({
        command: 'goto', position: { x: x, y: y }
    }))
}
</script>

<template>
    <cds-header>
        <cds-header-name href="javascript:void 0" prefix="BotCtrl">[Alpha]</cds-header-name>
        <Activity :class="[hearbeatIndictor ? 'activity-ok' : 'activity-bad']" />
        <cds-button kind="ghost">{{ state }}</cds-button>
        <cds-button v-if="run" kind="warning">Running</cds-button>
        <cds-button v-if="alarm" kind="danger">Alarm</cds-button>
    </cds-header>

    <div class="dro">
        <pre>
DX:     {{ dro.dx.toFixed(2) }}mm
DY:     {{ dro.dy.toFixed(2) }}mm
DAlpha: {{ dro.dAlpha.toFixed(2) }}&deg;
DBeta:  {{ dro.dBeta.toFixed(2) }}&deg;
Diag:
{{ diagmsg }}
GPX:    {{ ax.toFixed(2) }}mm
GPY:    {{ ay.toFixed(2) }}mm
        </pre>
    </div>
    <div class="controls">
        <cds-button @click="start"><img class="icon" src="@/assets/start.svg" />Start</cds-button>
        <cds-button @click="stop" kind="danger"><img class="icon" src="@/assets/stop.svg" />Stop</cds-button>
        <cds-button @click="reset" kind="secondary"><img class="icon" src="@/assets/reset.svg" />Reset</cds-button>
        <cds-button @click="updatePath" kind="tertiary">Send Path</cds-button>
    </div>

    <div class="editor">
        <cds-slider label-text="DX" max="300" min="-300" step="1" :value="ax"
            @cds-slider-changed="ax = $event.detail.value; immediate(ax, ay)"><cds-slider-input aria-label="Slider value"
                type="number"></cds-slider-input></cds-slider>
        <cds-slider label-text="DY" max="300" min="-300" step="1" .value="ay"
            @cds-slider-changed="ay = $event.detail.value; immediate(ax, ay)"><cds-slider-input aria-label="Slider value"
                type="number"></cds-slider-input></cds-slider>
    </div>
</template>

<style scoped>
.dro {
    position: absolute;
    width: 20%;
    top: 3rem;
    left: 0;
    padding: 1.1rem;
}

.controls {
    display: flex;
    position: absolute;
    bottom: 0;
}

.editor {
    position: absolute;
    width: 40%;
    top: 3rem;
    right: 0;
    padding: 1.1rem;
    background-color: var(--cds-background);
}

.icon {
    filter: invert(100%);
    max-width: 16px;
    max-height: 16px;
    margin-top: 1px;
    margin-right: 6px;
}

.activity-ok {
    filter: invert(82%) sepia(55%) saturate(4985%) hue-rotate(39deg) brightness(94%) contrast(82%);
}

.activity-bad {
    filter: invert(30%);
}
</style>

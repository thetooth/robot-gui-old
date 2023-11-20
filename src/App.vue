<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import '@carbon/web-components/es/components/ui-shell/index.js';
import '@carbon/web-components/es/components/button/index.js';
import '@carbon/web-components/es/components/icon-button/index.js';
import '@carbon/web-components/es/components/slider/index.js';
import { JSONCodec } from "nats.ws";
import { useNCStore } from "./stores/nc"
// import { modelRef, scene } from './scene';

import Activity from '@carbon/icons-vue/es/activity/16';

import Model from './components/Model.vue'
import SetPosition from './components/SetPosition.vue'
import Teach from './components/Teach.vue'
import Dynamics from './components/Dynamics.vue'

export default {
    components: {
        Activity,
        Model,
        SetPosition,
        Teach,
        Dynamics
    },
    setup() {
        const store = useNCStore()
        const jc = new JSONCodec()

        let statusSub = ref(null);

        let hearbeat = ref();
        let hearbeatIndictor = ref();
        let hearbeatInterval = null;

        let alarm = ref();
        let state = ref();

        let diagmsg = ref();

        onMounted(async () => {
            await store.setup()
            statusSub = store.nc.subscribe("motion.status");

            hearbeatInterval = setInterval(() => {
                if (hearbeat.value) {
                    hearbeatIndictor.value = true;
                    setTimeout(() => { hearbeatIndictor.value = false }, 100)
                } else {
                    hearbeatIndictor.value = false;
                }
                hearbeat.value = false
            }, 1000);

            (async () => {
                for await (const m of statusSub) {
                    let payload = jc.decode(m.data);
                    store.run = payload.run;
                    alarm.value = payload.alarm;
                    state.value = payload.state;
                    diagmsg.value = payload.diagMsg;
                    store.dro.dx = payload.dx
                    store.dro.dy = payload.dy
                    store.dro.vx = payload.vx
                    store.dro.vy = payload.vy
                    store.dro.dAlpha = payload.dAlpha
                    store.dro.dBeta = payload.dBeta
                    hearbeat.value = true

                    const gamepads = navigator.getGamepads();
                    for (const gp of gamepads) {
                        if (gp == null) {
                            continue
                        }

                        if (Math.abs(gp.axes[0]) < 0.01 && Math.abs(gp.axes[1]) < 0.01) {
                            continue
                        }

                        const mult = (1 / Math.pow(3, 4)) * Math.pow(Math.exp(gp.axes[2] + 1), 5.01);

                        store.controls.x += gp.axes[0] * mult * (1 / 120);
                        store.controls.y += gp.axes[1] * mult * (1 / 120);
                        store.immediate(store.controls.x, store.controls.y);
                        break;
                    }
                }
            })();

        })
        onBeforeUnmount(() => {
            clearInterval(hearbeatInterval);
            statusSub.unsubscribe();

            store.nc.close();
        })

        return {
            store, hearbeatIndictor, alarm, state, diagmsg,
        }
    }
}

</script>

<template>
    <cds-header>
        <cds-header-name href="javascript:void 0" prefix="BotCtrl">[Alpha]</cds-header-name>
        <Activity :class="[hearbeatIndictor ? 'activity-ok' : 'activity-bad']" />
        <cds-button kind="ghost">{{ state }}</cds-button>
        <cds-button v-if="store.run" kind="warning">Running</cds-button>
        <cds-button v-if="alarm" kind="danger">Alarm</cds-button>
    </cds-header>

    <div class="main">
        <div class="model">
            <Model v-if="store.ready" />
        </div>
        <div class="editor">
            <SetPosition v-if="store.ready" />
            <Teach v-if="store.ready" />
            <Dynamics v-if="store.ready" />
        </div>
        <div class="controls">
            <cds-button @click="store.start"><img class="icon" src="@/assets/start.svg" />Start</cds-button>
            <cds-button @click="store.stop" kind="danger"><img class="icon" src="@/assets/stop.svg" />Stop</cds-button>
            <cds-button @click="store.reset" kind="secondary"><img class="icon"
                    src="@/assets/reset.svg" />Reset</cds-button>
        </div>
    </div>

    <div class="dro">
        <pre>
DX:     {{ store.dro.dx.toFixed(3) }}mm
DY:     {{ store.dro.dy.toFixed(3) }}mm

VX:     {{ store.dro.vx.toFixed(3) }}&deg;/s
VY:     {{ store.dro.vy.toFixed(3) }}&deg;/s
DAlpha: {{ store.dro.dAlpha.toFixed(3) }}&deg;
DBeta:  {{ store.dro.dBeta.toFixed(3) }}&deg;

Diag:
{{ diagmsg }}
GPX:    {{ store.controls.x.toFixed(3) }}mm
GPY:    {{ store.controls.y.toFixed(3) }}mm
        </pre>
    </div>
</template>

<style scoped>
::-webkit-scrollbar {
    display: none;
}

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

.main {
    display: flex;
    height: 100vh;
}

.model {
    flex-basis: 75%;
    max-width: 75%;
    max-height: 100vh;
    overflow: hidden;
}

.editor {
    flex-basis: 25%;
    min-width: 480px;
    margin-top: 3rem;
    background-color: var(--cds-layer-01);
    color: var(--cds-text-secondary);
    overflow: scroll;
}

.icon {
    filter: invert(100%);
    max-width: 16px;
    max-height: 16px;
    margin-top: 1px;
    margin-right: 6px;
}

.icon-alt {
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

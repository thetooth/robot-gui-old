import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { connect, JSONCodec } from "nats.ws";

export const useNCStore = defineStore('nc', () => {
    const ready = ref(false);
    const jc = new JSONCodec();
    let nc = ref(null);

    let run = ref();
    let dro = ref({
        dx: 0, dy: 0, dAlpha: 0, dBeta: 0,
        ax: 0, ay: 0, vx: 0, vy: 0,
    });
    const controls = ref({
        x: 0, y: 150,
    })

    let scene = ref(null);
    let model = ref(null);

    const playing = false;

    async function setup() {
        nc.value = await connect({
            servers: ["ws://192.168.0.107:8000"],
        });
        this.ready = true;
    }
    function start() {
        this.nc.publish('motion.command', jc.encode({ command: 'start' }))
    }
    function stop() {
        this.nc.publish('motion.command', jc.encode({ command: 'stop' }))
    }
    function reset() {
        this.nc.publish('motion.command', jc.encode({ command: 'reset' }))
    }
    function immediate(x, y) {
        this.controls.x = x
        this.controls.y = y
        if (playing) {
            return
        }
        this.nc.publish('motion.command', jc.encode({
            command: 'goto', pose: { x: x, y: y }
        }))
    }

    return {
        setup, start, stop, reset, immediate,
        ready, nc, scene, model, dro, controls
    }
})

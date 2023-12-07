import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { connect, JSONCodec } from "nats.ws";

export const useNCStore = defineStore('nc', () => {
    const ready = ref(false);
    const jc = new JSONCodec();
    let nc = ref(null);

    let run = ref();
    let dro = ref({
        pose: {
            x: 0, y: 0, z: 0, r: 0,
            alpha: 0, beta: 0, phi: 0, theta: 0,
            alphaVelocity: 0, betaVelocity: 0, phiVelocity: 0, thetaVelocity: 0,
        }
    });
    const controls = ref({
        x: 0, y: 150, z: 0, r: 0
    })

    let scene = ref(null);
    let model = ref(null);

    const playing = false;

    let settings = ref([
        {
            "max-velocity": 600.0,
            "max-acceleration": 2500.0,
            "max-jerk": 10000.0
        },
        {
            "max-velocity": 600.0,
            "max-acceleration": 2500.0,
            "max-jerk": 10000.0
        },
        {
            "max-velocity": 2000.0,
            "max-acceleration": 100000.0,
            "max-jerk": 100000.0
        },
        {
            "max-velocity": 10000.0,
            "max-acceleration": 10000.0,
            "max-jerk": 100000.0
        },
    ])

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
    function immediate(x, y, z, r) {
        this.controls.x = x
        this.controls.y = y
        this.controls.z = z
        this.controls.r = r
        if (playing) {
            return
        }
        this.nc.publish('motion.command', jc.encode({
            command: 'goto', pose: { x: x, y: y, z: z, r: r }
        }))
    }

    return {
        setup, start, stop, reset, immediate,
        ready, nc, scene, model, dro, controls, settings
    }
})

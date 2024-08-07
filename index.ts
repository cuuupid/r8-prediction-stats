import Replicate, { Prediction } from 'replicate'
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN // can swap with a hard-coded token if you need
})

const model = process.argv.pop() ?? ''
const start = new Date('2024-08-07T16:00:00Z').valueOf()
const stop =  new Date('2024-08-07T17:00:00Z').valueOf()

const doBreak = (p: Prediction) => new Date(p.created_at).valueOf() < start
const valid = (p: Prediction) =>
    p.model === model &&
    new Date(p.created_at).valueOf() < stop
    && !doBreak(p)

const predictions: Prediction[] = []
for await (const ps of replicate.paginate(replicate.predictions.list)) {
    ps.map(p => valid(p) && predictions.push(p))
    if (ps.some(doBreak)) break;
}

console.log([
    "Prediction ID             ",
    "Predict",
    "Queued",
    "Cold",
    "Started at"
].join("\t|\t"))
for (const prediction of predictions) {
    const completed_at = new Date(prediction.completed_at!)
    const started_at = new Date(prediction.started_at!)
    const created_at = new Date(prediction.created_at)
    const running = completed_at.valueOf() - started_at.valueOf()
    const queued = started_at.valueOf() - created_at.valueOf()
    const isColdBoot = queued > (15 * 1000)

    console.log([
        prediction.id,
        (running / 1000).toFixed(2),
        (queued / 1000).toFixed(2),
        isColdBoot ? "Yes" : "No",
        created_at.toISOString()
    ].join("\t|\t"))
}




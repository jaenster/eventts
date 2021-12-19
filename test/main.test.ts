import {EventTS} from "../src";


const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('test', function () {

    [() => {
        const testEvents = {} as any as EventTS;
        testEvents.emit = EventTS.prototype.emit;
        testEvents.emitAsync = EventTS.prototype.emitAsync;
        testEvents.on = EventTS.prototype.on;
        testEvents.once = EventTS.prototype.once;
        testEvents.off = EventTS.prototype.off;
        return testEvents;
    }, () => new class extends EventTS {

    }].map(cb => cb()).map((testEvents: EventTS, idx) => {
        describe(idx !== 0 ? 'With actual object' : 'With random object', () => {

            test('on and emit', function () {
                let testData;

                testEvents.on('test', function (data) {
                    testData = data;
                    testData.data2 = 'string2';
                    delete testData.data3;
                });

                const sendData = {data: 'string', data3: 'string'};
                testEvents.emit('test', sendData);

                expect(testData).toBeDefined();
                expect(testData).toHaveProperty('data');
                expect(testData.data).toBe('string');
                expect(testData).toHaveProperty('data2');
                expect(testData.data2).toBe('string2');
                expect(sendData).toEqual(testData);
                expect(sendData).not.toHaveProperty('data3');

            });

            test('on and emit and once', function () {

                let testData;

                testEvents.on('test', function (data) {
                    testData = data;
                    testData.data2 = 'string2';
                    delete testData.data3;
                });

                testEvents.once('test', function (data) {
                    testData = data;
                    testData.data4 = 'string4';
                    delete testData.data3;
                });

                for (let i = 0; i < 5; i++) {
                    const sendData = {data: 'string', data3: 'string3'};
                    testEvents.emit('test', sendData);

                    expect(testData).toBeDefined();
                    expect(testData).toHaveProperty('data');
                    expect(testData.data).toBe('string');
                    expect(testData).toHaveProperty('data2');
                    expect(testData.data2).toBe('string2');
                    expect(sendData).toEqual(testData);
                    expect(sendData).not.toHaveProperty('data3');

                    // once is called on first go
                    if (i === 0) {
                        expect(testData).toHaveProperty('data4');
                        expect(testData.data4).toBe('string4');
                    } else {
                        expect(testData).not.toHaveProperty('data4');
                    }
                }

            });


            test('on and emit and once and off', function () {

                let testData;

                testEvents.on('test', function (data) {
                    testData = data;
                    testData.data2 = 'string2';
                    delete testData.data3;
                });

                testEvents.once('test', function (data) {
                    testData = data;
                    testData.data4 = 'string4';
                });

                const thirdHandler = function (data) {
                    testData = data;
                    testData.data5 = 'string5';
                };
                testEvents.on('test', thirdHandler);

                for (let i = 0; i < 5; i++) {

                    // On the third go, forget about last event handler
                    if (i === 3) testEvents.off('test', thirdHandler);

                    const sendData = {data: 'string', data3: 'string3'};
                    testEvents.emit('test', sendData);

                    expect(testData).toBeDefined();
                    expect(testData).toHaveProperty('data');
                    expect(testData.data).toBe('string');
                    expect(testData).toHaveProperty('data2');
                    expect(testData.data2).toBe('string2');
                    expect(sendData).toEqual(testData);
                    expect(sendData).not.toHaveProperty('data3');

                    // once is called on first go
                    if (i === 0) {
                        expect(testData).toHaveProperty('data4');
                        expect(testData.data4).toBe('string4');
                    } else {
                        expect(testData).not.toHaveProperty('data4');
                    }

                    // If its still called
                    if (i < 3) {
                        expect(testData).toHaveProperty('data5');
                        expect(testData.data5).toBe('string5');
                    } else {
                        expect(testData).not.toHaveProperty('data5');
                    }

                }
            });


            test('on and emit async and once and off', async function () {

                let testData;

                testEvents.on('test', async function (data) {
                    testData = data;
                    await delay(100);
                    testData.data2 = testData.data1;
                    testData.data4 = testData.data3;
                });

                testEvents.on('test', async function (data) {
                    testData = data;
                    await delay(50);
                    testData.data1 = 'string1';
                });

                testEvents.on('test', async function (data) {
                    testData = data;
                    await delay(150);
                    testData.data3 = 'string3';
                });

                await testEvents.emitAsync('test', {});

                expect(testData.data1).toBe('string1')
                // key 2 gets copied from the other event. They are in sync as one is delayed 50 ms, other 100 ms
                expect(testData.data2).toBe('string1')

                expect(testData.data3).toBe('string3')

                // Its not set on time, as 100 ms event is ran before the 150 ms event
                expect(testData.data4).not.toBe('string3')
            });
        });
    })


});
(function (global) {
  'use strict';

  const html = String.raw;

  function createElement(tag, props = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'class') el.className = value;
      else if (key === 'html') el.innerHTML = value;
      else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value);
    });
    children.forEach((child) => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child) el.appendChild(child);
    });
    return el;
  }

  function currencyFormat(amount, currency) {
    return `${currency} ${amount.toFixed(2)}`;
  }

  function computeDistanceKm(pickup, dropoff, distanceMatrixKm, fallback) {
    const key = `${pickup}|${dropoff}`;
    if (distanceMatrixKm && typeof distanceMatrixKm[key] === 'number') {
      return distanceMatrixKm[key];
    }
    return fallback;
  }

  function sumExtras(extras) {
    return extras.reduce((s, e) => s + (e.rate * (e.quantity || 0)), 0);
  }

  function buildStepper(current) {
    const steps = [
      { n: 1, label: 'SEARCH CAR' },
      { n: 2, label: 'SELECT CAR' },
      { n: 3, label: 'PERSONAL DETAILS' },
      { n: 4, label: 'CONFIRMATION' }
    ];
    const container = createElement('div', { class: 'tw-steps' });
    for (const step of steps) {
      container.appendChild(createElement('div', { class: `tw-step ${current === step.n ? 'active' : ''}` }, [
        createElement('div', { class: 'tw-badge' }, [String(step.n)]),
        createElement('div', {}, [step.label])
      ]));
    }
    return container;
  }

  function renderResults(state, api) {
    const results = createElement('div', { class: 'tw-results' });
    for (const car of state.config.carOptions) {
      const distanceKm = computeDistanceKm(state.pickup, state.dropoff, state.config.distanceMatrixKm, state.config.distanceFallbackKm);
      const base = state.config.perKmRate * distanceKm;
      const price = base * (car.priceMultiplier || 1);

      const media = createElement('div', { class: 'media' }, [
        createElement('img', { src: car.image || 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1200&auto=format&fit=crop', alt: car.name })
      ]);

      const chips = createElement('div', { class: 'tw-chip-row' });
      car.features.forEach((f) => chips.appendChild(createElement('div', { class: 'tw-chip' }, [f.label])));

      const content = createElement('div', { class: 'content' }, [
        createElement('h3', {}, [car.name]),
        chips
      ]);

      const side = createElement('div', { class: 'side' }, [
        createElement('div', { class: 'tw-price' }, [currencyFormat(price, state.config.currency)]),
        createElement('div', { class: 'tw-chip' }, [state.isOneWay ? 'One Way' : 'Two Ways']),
        createElement('button', { class: 'tw-cta', onClick: () => api.selectCar(car.id) }, ['View More'])
      ]);

      const card = createElement('div', { class: 'tw-card' }, [media, content, side]);
      results.appendChild(card);
    }
    return results;
  }

  function renderExtrasPanel(state, api, car) {
    const extrasContainer = createElement('div');

    // Free extras
    const freePanel = createElement('div', { class: 'tw-panel' }, [
      createElement('div', { class: 'tw-panel-head' }, ['Free Optional Extras']),
      createElement('div', { class: 'tw-panel-body' }, [
        createElement('table', { class: 'tw-table' }, [
          createElement('thead', {}, [
            createElement('tr', {}, [
              createElement('th', {}, [' ']),
              createElement('th', {}, ['Items']),
              createElement('th', {}, ['Rate']),
              createElement('th', {}, ['Total']),
              createElement('th', {}, ['Quantity'])
            ])
          ]),
          createElement('tbody', {}, state.config.freeExtras.map((item) => {
            const checkbox = createElement('input', { type: 'checkbox' });
            checkbox.addEventListener('change', () => {
              api.setExtra(item.id, checkbox.checked ? 1 : 0, item.rate);
            });
            const qty = createElement('select', { class: 'tw-qty' }, [
              ...Array.from({ length: 5 }).map((_, i) => createElement('option', { value: i + 1 }, [String(i + 1)]))
            ]);
            qty.addEventListener('change', () => {
              api.setExtra(item.id, checkbox.checked ? Number(qty.value) : 0, item.rate);
            });
            return createElement('tr', {}, [
              createElement('td', {}, [createElement('div', { class: 'tw-flex' }, [checkbox])]),
              createElement('td', {}, [item.label]),
              createElement('td', {}, [currencyFormat(item.rate, state.config.currency)]),
              createElement('td', {}, [currencyFormat(0, state.config.currency)]),
              createElement('td', {}, [qty])
            ]);
          }))
        ])
      ])
    ]);

    // Paid extras
    const paidPanel = createElement('div', { class: 'tw-panel' }, [
      createElement('div', { class: 'tw-panel-head' }, ['Paid Optional Extras']),
      createElement('div', { class: 'tw-panel-body' }, [
        createElement('table', { class: 'tw-table' }, [
          createElement('thead', {}, [
            createElement('tr', {}, [
              createElement('th', {}, [' ']),
              createElement('th', {}, ['Items']),
              createElement('th', {}, ['Rate']),
              createElement('th', {}, ['Total']),
              createElement('th', {}, ['Quantity'])
            ])
          ]),
          createElement('tbody', {}, state.config.paidExtras.map((item) => {
            const checkbox = createElement('input', { type: 'checkbox' });
            checkbox.addEventListener('change', () => {
              api.setExtra(item.id, checkbox.checked ? 1 : 0, item.rate);
            });
            const qty = createElement('select', { class: 'tw-qty' }, [
              ...Array.from({ length: 5 }).map((_, i) => createElement('option', { value: i + 1 }, [String(i + 1)]))
            ]);
            qty.addEventListener('change', () => {
              api.setExtra(item.id, checkbox.checked ? Number(qty.value) : 0, item.rate);
            });
            return createElement('tr', {}, [
              createElement('td', {}, [createElement('div', { class: 'tw-flex' }, [checkbox])]),
              createElement('td', {}, [item.label]),
              createElement('td', {}, [currencyFormat(item.rate, state.config.currency)]),
              createElement('td', {}, [currencyFormat(0, state.config.currency)]),
              createElement('td', {}, [qty])
            ]);
          }))
        ])
      ])
    ]);

    extrasContainer.appendChild(freePanel);
    extrasContainer.appendChild(paidPanel);

    return extrasContainer;
  }

  function renderSidebar(state, api) {
    const distanceKm = computeDistanceKm(state.pickup, state.dropoff, state.config.distanceMatrixKm, state.config.distanceFallbackKm);
    const base = state.config.perKmRate * distanceKm * (state.selectedCar?.priceMultiplier || 1);
    const extrasTotal = sumExtras(state.extras);
    const total = base + extrasTotal;

    const sidebar = createElement('div', { class: 'tw-sidebar' }, [
      createElement('div', { class: 'tw-summary' }, [
        createElement('h4', {}, ['Total Transfer price']),
        createElement('div', { class: 'tw-summary-body' }, [
          createElement('div', { class: 'line' }, ['Transfer Cost', currencyFormat(base, state.config.currency)]),
          createElement('div', { class: 'line' }, ['Extras', currencyFormat(extrasTotal, state.config.currency)]),
          createElement('div', { class: 'line highlight' }, ['Total Amount', currencyFormat(total, state.config.currency)])
        ])
      ]),
    ]);

    return sidebar;
  }

  function renderPersonalForm(state, api) {
    const form = createElement('div', { class: 'tw-panel' }, [
      createElement('div', { class: 'tw-panel-head' }, ['Personal Information']),
      createElement('div', { class: 'tw-panel-body' }, [
        createElement('div', { class: 'tw-grid', style: 'padding:16px;' }, [
          // left column
          createElement('div', { class: 'tw-field' }, [
            createElement('label', {}, ['Title']),
            createElement('select', { id: 'pi-title' }, [
              createElement('option', { value: 'Mr' }, ['Mr']),
              createElement('option', { value: 'Mrs' }, ['Mrs']),
              createElement('option', { value: 'Miss' }, ['Miss'])
            ])
          ]),
          createElement('div', { class: 'tw-field' }, [
            createElement('label', {}, ['City']),
            createElement('input', { id: 'pi-city', placeholder: 'Enter Your City' })
          ]),
          createElement('div', { class: 'tw-field' }, [
            createElement('label', {}, ['First Name']),
            createElement('input', { id: 'pi-first', placeholder: 'Enter First Name', value: 'albart' })
          ]),
          createElement('div', { class: 'tw-field' }, [
            createElement('label', {}, ['Country']),
            createElement('input', { id: 'pi-country', placeholder: 'Select Country' })
          ]),
          createElement('div', { class: 'tw-field' }, [
            createElement('label', {}, ['Last Name']),
            createElement('input', { id: 'pi-last', placeholder: 'Enter Last Name' })
          ]),
          createElement('div', { class: 'tw-field' }, [
            createElement('label', {}, ['Mobile No']),
            createElement('input', { id: 'pi-mobile', placeholder: 'Enter Your Mobile No' })
          ]),
          createElement('div', { class: 'tw-field' }, [
            createElement('label', {}, ['E-mail']),
            createElement('input', { id: 'pi-email', type: 'email', placeholder: 'Enter Your Mail' })
          ]),
          createElement('div', { class: 'tw-field' }, [
            createElement('label', {}, ['Phone No']),
            createElement('input', { id: 'pi-phone', placeholder: 'Enter Your Phone No' })
          ])
        ])
      ])
    ]);

    return form;
  }

  function init(container, config) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) throw new Error('TaxiBookingWidget: container not found');

    const state = {
      config: Object.assign({ currency: '$', perKmRate: 1.0, distanceFallbackKm: 10 }, config || {}),
      step: 1,
      isOneWay: true,
      pickup: '',
      dropoff: '',
      date: '',
      time: '',
      adults: 1,
      children: 0,
      infants: 0,
      selectedCar: null,
      extras: [],
    };

    const api = {
      goToStep(n) { state.step = n; render(); },
      setTripType(oneWay) { state.isOneWay = oneWay; render(); },
      search() {
        if (!state.pickup || !state.dropoff || !state.date || !state.time) {
          alert('Please complete pickup, drop-off, date and time');
          return;
        }
        state.step = 2; render();
      },
      selectCar(id) {
        state.selectedCar = state.config.carOptions.find((c) => c.id === id) || null;
        state.step = 3; render();
      },
      setExtra(id, quantity, rate) {
        const idx = state.extras.findIndex((e) => e.id === id);
        if (idx === -1) state.extras.push({ id, quantity, rate });
        else state.extras[idx] = { id, quantity, rate };
        render();
      },
      submit() {
        if (!state.selectedCar) { alert('Please select a car first'); return; }
        const payload = {
          tripType: state.isOneWay ? 'one_way' : 'two_ways',
          pickup: state.pickup, dropoff: state.dropoff,
          date: state.date, time: state.time,
          passengers: { adults: state.adults, children: state.children, infants: state.infants },
          carId: state.selectedCar.id,
          extras: state.extras,
          pricing: (function () {
            const distanceKm = computeDistanceKm(state.pickup, state.dropoff, state.config.distanceMatrixKm, state.config.distanceFallbackKm);
            const base = state.config.perKmRate * distanceKm * (state.selectedCar?.priceMultiplier || 1);
            const extrasTotal = sumExtras(state.extras);
            return { distanceKm, base, extras: extrasTotal, total: base + extrasTotal };
          })(),
          personal: {
            title: document.getElementById('pi-title')?.value || '',
            firstName: document.getElementById('pi-first')?.value || '',
            lastName: document.getElementById('pi-last')?.value || '',
            city: document.getElementById('pi-city')?.value || '',
            country: document.getElementById('pi-country')?.value || '',
            mobile: document.getElementById('pi-mobile')?.value || '',
            email: document.getElementById('pi-email')?.value || '',
            phone: document.getElementById('pi-phone')?.value || ''
          }
        };
        if (typeof state.config.onSubmit === 'function') state.config.onSubmit(payload);
        state.step = 4; render();
      }
    };

    function render() {
      root.innerHTML = '';

      const widget = createElement('div', { class: 'taxi-widget' });

      // Header
      widget.appendChild(createElement('div', { class: 'tw-header' }, [
        createElement('div', { class: 'tw-badge' }, ['S']),
        createElement('div', {}, ['SEARCH FOR AVAILABILITY'])
      ]));

      // Trip tabs
      const tabs = createElement('div', { class: 'tw-tabs' });
      const tabOne = createElement('label', { class: 'tw-tab' }, [
        createElement('input', { type: 'radio', name: 'trip', checked: state.isOneWay ? 'checked' : null, onChange: () => api.setTripType(true) }),
        'One Way'
      ]);
      const tabTwo = createElement('label', { class: 'tw-tab' }, [
        createElement('input', { type: 'radio', name: 'trip', checked: !state.isOneWay ? 'checked' : null, onChange: () => api.setTripType(false) }),
        'Two Ways'
      ]);
      const tabPoint = createElement('label', { class: 'tw-tab' }, [
        createElement('input', { type: 'radio', name: 'trip2', disabled: 'disabled' }),
        'Point to Point'
      ]);
      tabs.appendChild(tabOne); tabs.appendChild(tabTwo); tabs.appendChild(tabPoint);

      // Search form
      const form = createElement('div', { class: 'tw-form' });
      const inPickup = createElement('div', { class: 'tw-input' }, [
        '📍', createElement('input', { placeholder: 'Enter Pick Up Location', value: state.pickup, onInput: (e) => { state.pickup = e.target.value; } })
      ]);
      const inDrop = createElement('div', { class: 'tw-input' }, [
        '📍', createElement('input', { placeholder: 'Enter Drop off Location', value: state.dropoff, onInput: (e) => { state.dropoff = e.target.value; } })
      ]);
      const inDate = createElement('div', { class: 'tw-date' }, [
        '📅', createElement('input', { type: 'date', value: state.date, onInput: (e) => { state.date = e.target.value; } })
      ]);
      const inTime = createElement('div', { class: 'tw-date' }, [
        '⏰', createElement('input', { type: 'time', value: state.time, onInput: (e) => { state.time = e.target.value; } })
      ]);
      const inTrav = createElement('div', { class: 'tw-number' }, [
        'Travelers', createElement('input', { type: 'number', min: 1, value: state.adults, onInput: (e) => { state.adults = Number(e.target.value || 1); } })
      ]);
      const btnSearch = createElement('button', { class: 'tw-cta', onClick: api.search }, ['Search Availability']);

      form.appendChild(inPickup);
      form.appendChild(inDrop);
      form.appendChild(inDate);
      form.appendChild(inTime);
      form.appendChild(inTrav);
      form.appendChild(btnSearch);

      widget.appendChild(tabs);
      widget.appendChild(form);

      // Stepper
      widget.appendChild(buildStepper(state.step));

      if (state.step === 1) {
        // Nothing else
      }

      if (state.step === 2) {
        widget.appendChild(renderResults(state, api));
      }

      if (state.step === 3 && state.selectedCar) {
        const row = createElement('div', { class: 'row' });

        const main = createElement('div');
        // Selected car header
        const selectedCard = renderResults({ ...state, config: { ...state.config, carOptions: [state.selectedCar] } }, api);
        // Replace CTA to Modify
        selectedCard.querySelectorAll('.tw-cta').forEach((btn) => { btn.textContent = 'Modify'; btn.onclick = () => api.goToStep(2); });
        main.appendChild(selectedCard);

        main.appendChild(renderExtrasPanel(state, api, state.selectedCar));
        main.appendChild(renderPersonalForm(state, api));
        row.appendChild(main);

        // Sidebar
        const sidebar = renderSidebar(state, api);
        row.appendChild(sidebar);

        widget.appendChild(row);

        // Actions
        widget.appendChild(createElement('div', { class: 'tw-actions' }, [
          createElement('button', { class: 'tw-cta', onClick: api.submit }, ['Confirm & Pay'])
        ]));
      }

      if (state.step === 4) {
        widget.appendChild(createElement('div', { class: 'tw-panel', style: 'margin:24px' }, [
          createElement('div', { class: 'tw-panel-head' }, ['Confirmation']),
          createElement('div', { class: 'tw-panel-body', style: 'padding:24px' }, [
            createElement('p', {}, ['Thank you! Your booking request has been received. We will contact you shortly.'])
          ])
        ]));
      }

      root.appendChild(widget);
    }

    render();

    return api;
  }

  global.TaxiBookingWidget = { init };
})(window);
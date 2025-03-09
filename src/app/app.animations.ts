import { trigger, transition, style, animate } from "@angular/animations";

export const slideInAnimation = trigger('routeAnimations', [
    transition('home => shopping-cart', [
        style({ transform: 'translateX(100%)' }),
        animate('1s ease-in', style({ transform: 'translateX(0%)' }))
    ]),
    transition('shopping-cart => home', [
        style({ transform: 'translateX(-100%)' }),
        animate('1s ease-out', style({ transform: 'translateX(0%)' }))
    ]),
    transition('shopping-cart => checkout', [
        style({ transform: 'translateX(100%)' }),
        animate('1s ease-in', style({ transform: 'translateX(0%)' }))
    ]),
    transition('checkout => shopping-cart', [
        style({ transform: 'translateX(-100%)' }),
        animate('1s ease-out', style({ transform: 'translateX(0%)' }))
    ])
]);

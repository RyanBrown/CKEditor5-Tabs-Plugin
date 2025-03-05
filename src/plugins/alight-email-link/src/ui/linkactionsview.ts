/**
 * A simplified LinkActionsView for the Email Link plugin.
 */
import { ButtonView, View, ViewCollection, FocusCycler, type FocusableView } from 'ckeditor5/src/ui';
import { FocusTracker, KeystrokeHandler, type Locale } from 'ckeditor5/src/utils';
import { icons } from 'ckeditor5/src/core';

/**
 * The link actions view class. This view displays the link preview, allows
 * unlinking or editing the link.
 */
export default class LinkActionsView extends View {
	/**
	 * Tracks information about DOM focus in the actions.
	 */
	public readonly focusTracker = new FocusTracker();

	/**
	 * An instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
	 */
	public readonly keystrokes = new KeystrokeHandler();

	/**
	 * The href preview view.
	 */
	public previewButtonView: ButtonView;

	/**
	 * The unlink button view.
	 */
	public unlinkButtonView: ButtonView;

	/**
	 * The edit link button view.
	 */
	public editButtonView: ButtonView;

	/**
	 * The value of the "href" attribute of the link to use in the {@link #previewButtonView}.
	 *
	 * @observable
	 */
	declare public href: string | undefined;

	/**
	 * A collection of views that can be focused in the view.
	 */
	private readonly _focusables = new ViewCollection<FocusableView>();

	/**
	 * Helps cycling over {@link #_focusables} in the view.
	 */
	private readonly _focusCycler: FocusCycler;

	/**
	 * @inheritDoc
	 */
	constructor(locale: Locale) {
		super(locale);

		const t = locale.t;

		this.set('href', undefined);

		// Create a custom unlink icon
		const unlinkIcon = '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="m11.077 15 .991-1.416a.75.75 0 1 1 1.229.86l-1.148 1.64a.748.748 0 0 1-.217.206 5.251 5.251 0 0 1-8.503-5.955.741.741 0 0 1 .12-.274l1.147-1.639a.75.75 0 1 1 1.228.86L4.933 10.7l.006.003a3.75 3.75 0 0 0 6.132 4.294l.006.004zm5.494-5.335a.748.748 0 0 1-.12.274l-1.147 1.639a.75.75 0 1 1-1.228-.86l.86-1.23a3.75 3.75 0 0 0-6.144-4.301l-.86 1.229a.75.75 0 0 1-1.229-.86l1.148-1.64a.748.748 0 0 1 .217-.206 5.251 5.251 0 0 1 8.503 5.955zm-4.563-2.532a.75.75 0 0 1 .184 1.045l-3.155 4.505a.75.75 0 1 1-1.229-.86l3.155-4.506a.75.75 0 0 1 1.045-.184z"/><path d="M16.927 17.695a.75.75 0 0 1-1.075 1.045l-11.5-11.5a.75.75 0 0 1 1.075-1.045l11.5 11.5z"/></svg>';

		// Create preview button
		this.previewButtonView = this._createPreviewButton();
		this.unlinkButtonView = this._createButton(t('Unlink'), unlinkIcon, 'unlink');
		this.editButtonView = this._createButton(t('Edit link'), icons.pencil, 'edit');

		this._focusCycler = new FocusCycler({
			focusables: this._focusables,
			focusTracker: this.focusTracker,
			keystrokeHandler: this.keystrokes,
			actions: {
				focusPrevious: 'shift + tab',
				focusNext: 'tab'
			}
		});

		this.setTemplate({
			tag: 'div',
			attributes: {
				class: [
					'ck',
					'ck-link-actions',
					'ck-responsive-form'
				],
				tabindex: '-1'
			},
			children: [
				this.previewButtonView,
				this.editButtonView,
				this.unlinkButtonView
			]
		});
	}

	/**
	 * @inheritDoc
	 */
	public override render(): void {
		super.render();

		const childViews = [
			this.previewButtonView,
			this.editButtonView,
			this.unlinkButtonView
		];

		childViews.forEach(v => {
			// Register the view as focusable.
			this._focusables.add(v);

			// Register the view in the focus tracker.
			this.focusTracker.add(v.element!);
		});

		// Start listening for the keystrokes coming from #element.
		this.keystrokes.listenTo(this.element!);
	}

	/**
	 * @inheritDoc
	 */
	public override destroy(): void {
		super.destroy();

		this.focusTracker.destroy();
		this.keystrokes.destroy();
	}

	/**
	 * Focuses the fist {@link #_focusables} in the actions.
	 */
	public focus(): void {
		this._focusCycler.focusFirst();
	}

	/**
	 * Creates a button view.
	 */
	private _createButton(label: string, icon: string, eventName: string): ButtonView {
		const button = new ButtonView(this.locale);

		button.set({
			label,
			icon,
			tooltip: true
		});

		button.delegate('execute').to(this, eventName);

		return button;
	}

	/**
	 * Creates a link href preview button.
	 */
	private _createPreviewButton(): ButtonView {
		const button = new ButtonView(this.locale);
		const bind = this.bindTemplate;
		const t = this.t!;

		button.set({
			withText: true,
			tooltip: t('Open link in new tab')
		});

		button.extendTemplate({
			attributes: {
				class: [
					'ck',
					'ck-link-actions__preview'
				],
				href: bind.to('href'),
				target: '_blank',
				rel: 'noopener noreferrer'
			}
		});

		button.bind('label').to(this, 'href', href => {
			return href || t('This link has no URL');
		});

		button.bind('isEnabled').to(this, 'href', href => Boolean(href));

		button.template!.tag = 'a';

		return button;
	}
}

/**
 * Fired when the {@link ~LinkActionsView#editButtonView} is clicked.
 *
 * @eventName ~LinkActionsView#edit
 */
export type EditEvent = {
	name: 'edit';
	args: [];
};

/**
 * Fired when the {@link ~LinkActionsView#unlinkButtonView} is clicked.
 *
 * @eventName ~LinkActionsView#unlink
 */
export type UnlinkEvent = {
	name: 'unlink';
	args: [];
};

/**
 * Options interface for the link actions view.
 */
export interface LinkActionsViewOptions {
	/**
	 * Returns `true` when bookmark `id` matches the hash from `link`.
	 */
	isScrollableToTarget: (href: string | undefined) => boolean;

	/**
	 * Scrolls the view to the desired bookmark or open a link in new window.
	 */
	scrollToTarget: (href: string) => void;
}
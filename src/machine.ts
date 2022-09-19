type Handler<T> = (input: T, next: (name: string) => any) => any;

/**
 *
 * @param input
 */
const factory = <T>(input: T) => {
    let data = input;
    const functions: Record<string, Handler<T>> = {};

    /**
     *
     * @param subject
     */
    const update = (subject) => {
        data = subject;

        return data;
    };

    /**
     *
     * @param name
     * @param handler
     */
    const register = (name: string, handler: Handler<T>) => {
        functions[name] = handler;

        return ({
            register,
            run,
        });
    };

    /**
     *
     * @param name
     */
    const run = (name: string): T => {
        const {[name]: fn} = functions;

        return update(fn(data, run));
    };

    return {
        register,
        run,
    };
};

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 19.09.22
 * Time: 20:40
 */
export default factory;

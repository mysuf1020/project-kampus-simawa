import { type PrimitiveAtom, useAtom } from 'jotai'

// use this hook to provide a seed an atom with its initial value
const useAtomSeeder = <T,>(atom: PrimitiveAtom<T>, value: T): T => {
  const [atomState, setAtomState] = useAtom(atom)

  if (atomState == undefined) {
    setAtomState(value)
  }

  return atomState
}

export default useAtomSeeder

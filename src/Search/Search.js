import React, { useEffect, useRef, forwardRef, useReducer } from 'react'
import './style.css'

const OptionsList = forwardRef(
  ({ options, selectedOption = null, onSelect, onHover }, ref) => {
    return (
      <ul class="options" ref={ref}>
        {options.map((option, index) => {
          return (
            <li
              className={`options-item ${
                selectedOption === index ? 'hovered' : ''
              }`}
              key={`${option}-${index}`}
              onClick={(e) => onSelect(option, e)}
              onMouseEnter={onHover}
            >
              {option}
            </li>
          )
        })}
      </ul>
    )
  }
)

const reducer = (state, action) => {
  switch (action.type) {
    case 'update':
      return {
        ...state,
        ...action.payload,
      }
    default:
      return state
  }
}

const filterOptions = (options, key) => {
  return options.filter(
    (option) => option.toLowerCase().indexOf(key.toLowerCase()) > -1
  )
}

export const Search = ({
  options = [],
  onChange = () => {},
  onSubmit = () => {},
}) => {
  const containerRef = useRef(null)
  const dropDownRef = useRef(null)
  const inputRef = useRef(null)

  const initialState = {
    userInput: '',
    selectedOption: null,
    filteredOptions: options,
    showSuggestions: false,
  }
  const [
    { userInput, selectedOption, filteredOptions, showSuggestions },
    dispatch,
  ] = useReducer(reducer, initialState)

  useEffect(() => {
    document.addEventListener('click', handleClickOutside, false)
    return () => {
      document.removeEventListener('click', handleClickOutside, false)
    }
  }, [])

  const onFocus = () =>
    dispatch({
      type: 'update',
      payload: { showSuggestions: userInput && filteredOptions.length },
    })

  const handleClickOutside = (e) => {
    if (containerRef.current && dropDownRef.current) {
      if (
        !containerRef.current.contains(e.target) &&
        !dropDownRef.current.contains(e.target)
      ) {
        dispatch({ type: 'update', payload: { showSuggestions: false } })
      }
    }
  }

  const handleChange = (e) => {
    const currentInput = e.currentTarget.value
    const currentOptions = filterOptions(options, currentInput)
    dispatch({
      type: 'update',
      payload: {
        filteredOptions: currentOptions,
        userInput: currentInput,
        showSuggestions: currentInput && currentOptions.length,
      },
    })
    onChange(userInput, e)
  }

  const handleKeyPress = (e) => {
    if (e.keyCode === 13) {
      if (selectedOption !== null) {
        const currentInput = filteredOptions[selectedOption]
        const currentOptions = filterOptions(options, currentInput)
        dispatch({
          type: 'update',
          payload: { userInput: currentInput, filteredOptions: currentOptions },
        })
      }
      dispatch({ type: 'update', payload: { showSuggestions: false } })
      onSubmit(userInput, e)
      inputRef.current.blur()
      return
    }
    if (showSuggestions) {
      if (e.keyCode === 38) {
        const currentOption =
          selectedOption !== null
            ? (filteredOptions.length + selectedOption - 1) %
              filteredOptions.length
            : filteredOptions.length - 1
        dispatch({ type: 'update', payload: { selectedOption: currentOption } })
      }
      if (e.keyCode === 40) {
        const currentOption =
          selectedOption !== null
            ? (selectedOption + 1) % filteredOptions.length
            : 0
        dispatch({ type: 'update', payload: { selectedOption: currentOption } })
      }
    }
  }

  const handleSearchClick = (e) => {
    dispatch({ type: 'update', payload: { showSuggestions: false } })
    onSubmit(userInput, e)
  }
  return (
    <div class="search" ref={containerRef}>
      <div className="search-field">
        <input
          ref={inputRef}
          type="text"
          class="search-box"
          value={userInput}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          onFocus={onFocus}
        />
        <div class="search-btn" onClick={handleSearchClick} />
      </div>
      {showSuggestions ? (
        <OptionsList
          ref={dropDownRef}
          options={filteredOptions}
          selectedOption={selectedOption}
          onHover={() => {
            dispatch({ type: 'update', payload: { selectedOption: null } })
          }}
          onSelect={(selectedOption) => {
            const currentOptions = filterOptions(options, selectedOption)

            dispatch({
              type: 'update',
              payload: {
                userInput: selectedOption,
                filteredOptions: currentOptions,
                showSuggestions: false,
              },
            })
          }}
        />
      ) : (
        <></>
      )}
    </div>
  )
}

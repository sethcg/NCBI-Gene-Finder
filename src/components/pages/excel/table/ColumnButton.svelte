<script lang="ts">
  import { Dropdown, DropdownItem } from 'flowbite-svelte'
  import { tableHeaders } from 'src/stores/tableStore'

  export let columnIndex: number
  export let label: string
  export let buttonId: string

  const buttonClass = 'block w-full m-0 border-2 rounded-lg bg-transparent border-transparent'

  const baseClass = 'bg-transparent rounded-lg px-2 min-h-[20px]'
  const accessionClass = 'bg-danger-500 rounded-lg px-2 min-h-[20px]'

  $: indicatorClass =
    $tableHeaders.accessionColumn?.index == columnIndex ? accessionClass : baseClass
  $: description = $tableHeaders.accessionColumn?.index == columnIndex ? 'Acc #' : ''

  const handleClick = (e: any) => {
    e.preventDefault()
    const currentIndicator = document.getElementById(`${buttonId}_indicator`)

    switch (e.target.dataset.type) {
      case 'accession':
        // ADD TO ACCESSION AND APPLY INDICATOR CLASS
        $tableHeaders.accessionColumn = {
          label: label,
          index: columnIndex,
          indicatorId: `${buttonId}_indicator`
        }
        if (currentIndicator) currentIndicator.className = accessionClass
        break
      case 'include':
        // REMOVE FROM ACCESSION
        if ($tableHeaders.accessionColumn?.index == columnIndex)
          $tableHeaders.accessionColumn = undefined
        break
      default:
        // REMOVE FROM ACCESSION
        if ($tableHeaders.accessionColumn?.index == columnIndex)
          $tableHeaders.accessionColumn = undefined
        // APPLY INDICATOR CLASS
        if (currentIndicator) currentIndicator.className = baseClass
        break
    }

    // APPLY DESCRIPTION
    description = e.target.dataset.description
  }
</script>

<button id={buttonId} class={buttonClass} type="button">
  <div class="flex flex-col gap-y-[2px] justify-center items-start">
    <div class="flex flex-col justify-center items-center">
      <div id={`${buttonId}_indicator`} class={indicatorClass}>
        {description}
      </div>
      <Dropdown triggeredBy="#{buttonId}">
        <DropdownItem
          data-type={'accession'}
          data-description={'Acc #'}
          defaultClass={"px-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600'"}
          on:click={handleClick}>Accession Version</DropdownItem
        >
        <DropdownItem
          data-type={'none'}
          data-description={''}
          defaultClass={"px-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600'"}
          on:click={handleClick}>None</DropdownItem
        >
      </Dropdown>
    </div>
    <div class="max-w-32 truncate">{label}</div>
  </div>
</button>

import {Button, Label, ListBox, ListBoxItem, Popover, Select, SelectValue} from 'react-aria-components';
import ChevronUpDownIcon from '@spectrum-icons/workflow/ChevronUpDown';
import CheckIcon from '@spectrum-icons/workflow/Checkmark';

function StockStatusSelect({ value, onChange, className = "" }) {
  const handleSelectionChange = (key) => {
    onChange(key === 'in-stock');
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <Select 
        className="flex flex-col gap-1 w-[160px]"
        selectedKey={value ? 'in-stock' : 'out-of-stock'}
        onSelectionChange={handleSelectionChange}
      >
        <Label className="text-gray-700 cursor-default text-sm font-medium">Stock Status</Label>
        <Button className="flex items-center cursor-default rounded-lg border border-gray-300 bg-white hover:bg-gray-50 pressed:bg-gray-100 transition py-2 pl-3 pr-2 text-sm text-left leading-normal shadow-sm text-gray-700 focus:outline-hidden focus-visible:ring-2 ring-blue-500 ring-offset-2">
          <SelectValue className="flex-1 truncate placeholder-shown:italic" />
          <ChevronUpDownIcon size="XS" />
        </Button>
        <Popover className="max-h-60 w-[--trigger-width] overflow-auto rounded-md bg-white text-sm shadow-lg ring-1 ring-black/5 entering:animate-in entering:fade-in exiting:animate-out exiting:fade-out">
          <ListBox className="outline-hidden p-1">
            <StockStatusItem textValue="In Stock">
              <StockStatus className="bg-green-500" />
              In Stock
            </StockStatusItem>
            <StockStatusItem textValue="Out of Stock">
              <StockStatus className="bg-red-500" />
              Out of Stock
            </StockStatusItem>
          </ListBox>
        </Popover>
      </Select>
    </div>
  );
}

function StockStatusItem(props) {
  return (
    <ListBoxItem
      {...props}
      className="group flex items-center gap-2 cursor-default select-none py-2 px-3 outline-hidden rounded-sm text-gray-900 focus:bg-blue-600 focus:text-white hover:bg-blue-50"
    >
      {({ isSelected }) => (
        <>
          <span className="flex-1 flex items-center gap-2 truncate font-normal group-selected:font-medium">
            {props.children}
          </span>
          <span className="w-4 flex items-center text-blue-600 group-focus:text-white">
            {isSelected && <CheckIcon size="S" />}
          </span>
        </>
      )}
    </ListBoxItem>
  );
}

function StockStatus({ className }) {
  return (
    <span
      className={`w-3 h-3 rounded-full border border-solid border-white ${className}`}
    />
  );
}

export default StockStatusSelect;